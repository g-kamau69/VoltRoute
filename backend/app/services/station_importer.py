import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

OVERPASS_URLS = [
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.nchc.org.tw/api/interpreter",
    "https://overpass-api.de/api/interpreter",
]

NAIROBI_BBOX = (-1.55, 36.55, -1.05, 37.25)

PROVIDERS = [
    "Ampersand",
    "Spiro",
    "ARC Ride",
    "Zeno",
    "Roam",
    "Powerhive",
]

def fetch_swap_stations():
    south, west, north, east = NAIROBI_BBOX

    bbox = f"({south},{west},{north},{east})"


    query = f"""
        [out:json][timeout:90];
        (
            nwr["name"~"Ampersand|Spiro|ARC Ride|Zeno|Roam|Powerhive",i]{bbox};
            nwr["operator"~"Ampersand|Spiro|ARC Ride|Zeno|Roam|Powerhive",i]{bbox};
            nwr["brand"~"Ampersand|Spiro|ARC Ride|Zeno|Roam|Powerhive",i]{bbox};
    
            nwr["name"~"battery.?swap|battery.?exchange|swap.?station|swapping.?station",i]{bbox};
    
            nwr["amenity"="charging_station"]{bbox};
            nwr["amenity"="battery_swap"]{bbox};
    
            nwr["charging_station:battery_swapping"]{bbox};
            nwr["service:battery_swap"]{bbox};
            nwr["vending"="battery_swap"]{bbox};
        );
        out center;
        """
    
    retry_strategy = Retry(
        total=1,
        backoff_factor=2,
        status_forcelist=[429, 502, 503, 504],
        allowed_methods=["POST"],
        respect_retry_after_header=True,
    )

    session = requests.Session()
    session.mount(
        "https://",
        HTTPAdapter(max_retries=retry_strategy),
    )

    response = None

    try:
        for url in OVERPASS_URLS:
            try:
                print(f"Trying OverPass server: {url}")

                response = session.post(
                    url,
                    data={"data": query},
                    timeout=90,
                    headers={
                        "User-Agent": "VoltRouteResearchImporter/0.4"
                    },
                )

                response.raise_for_status()
                break

            except requests.RequestException as exc:
                print(f"Server unavailable: {exc}")
                response = None

        if response is None:
            raise RuntimeError(
                "All OverPass servers failed. "
                "Try again later."
            )
        data = response.json()

    finally:
        session.close()

    candidates = []
    seen = set()

    for element in data.get("elements", []):
        osm_type = element["type"]
        osm_id = element["id"]
        key = (osm_type, osm_id)

        if key in seen:
            continue
        seen.add(key)

        tags = element.get("tags", {})

        lat = element.get("lat")
        lon = element.get("lon")

        if lat is None or lon is None:
            center = element.get("center", {})
            lat = center.get("lat")
            lon = center.get("lon")
        if lat is None or lon is None:
            continue

        name = tags.get("name", "Unnamed location")
        operator = tags.get(
            "operator",
            tags.get("brand", "Unknown")
        )

        text = f"{name} {operator}".lower()

        swap_tags = (
            "battery swap",
            "battery swapping",
            "battery exchange",
            "swap station",
            "swapping station",
        )
        name_lower = name.lower()

        amenity = tags.get("amenity", "").lower()
        shop = tags.get("shop", "").lower() 
        office = tags.get("office", "").lower()

        explicit_swap_tags = (
            tags.get(
                "charging_station:battery_swapping", ""
            ).lower() in ("yes", "only")
            or tags.get(
                "service:battery_swap", ""
            ).lower() == "yes"
            or amenity == "battery_swap"
            or tags.get(
                "vending", ""
            ).lower() == "battery_swap"
        )

        swap_keywords = (
                "battery swap",
                "battery swapping",
                "battery exchange",
                "swap station",
                "swapping station",
            )

        is_swap_named = any(
                keyword in name_lower
                for keyword in swap_keywords
            )

        is_office = (
                office != ""
                or any(
                    word in name_lower
                    for word in (
                        "head office",
                        "headquarters",
                        "corporate office",
                    )
                )
            )

        if is_office:
            category = "office_not_station"
        elif explicit_swap_tags:
            category = "swap_tagged_candidate"

        elif is_swap_named:
                category = "swap_named_candidate"
            
        elif shop == "motorcycle_repair":
            category = "motorcycle_repair_unverified"
            
        elif amenity == "charging_station":
            category = "charging_only_unverified"
            
        else:
            category = "provider_related_unverified"
            
        
        candidates.append({
            "name":name,
            "operator": operator,
            "latitude": lat,
            "longitude": lon,
            "category": category,
            "osm_type": osm_type,
            "osm_id": osm_id,
            "source": (
                f"https://www.openstreetmap.org/"
                f"{osm_type}/{osm_id}"
            ),
        })

    return candidates

if __name__ == "__main__":
    try:
        results = fetch_swap_stations()

        print(f"\nTotal locations discovered: {len(results)}")

        groups = [
            "swap_tagged_candidate",
            "swap_named_candidate",
            "charging_only_unverified",
            "motorcycle_repair_unverified",
            "provider_related_unverified",
            "office_not_station",
        ]

        for category in groups:
            items = [
                item for item in results
                if item["category"] == category
            ]

            print(f"\n=== {category}: {len(items)} ===")

            for item in items[:30]:
                print(
                    f"{item['name']} | "
                    f"{item['operator']} | "
                    f"{item['latitude']}, "
                    f"{item['longitude']} | "
                    f"{item['source']}"
                )

            if len(items) > 30:
                print(f"... {len(items) - 30} more not shown")

    except requests.RequestException as exc:
        print(f"Data collection failed: {exc}")
