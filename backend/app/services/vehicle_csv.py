
import csv
import io

from pydantic import ValidationError

from app.schemas.vehicle import VehicleCreate


MAX_IMPORT_ROWS = 1000

REQUIRED_COLUMNS = {
    "fleet_id",
    "registration_number",
    "manufacturer",
    "model",
    "vehicle_type",
    "battery_capacity_kwh",
    "energy_consumption_wh_per_km",
    "battery_configuration",
}

OPTIONAL_COLUMNS = {
    "vin",
    "battery_level",
    "telemetry_source",
}


def validate_vehicle_csv(content: str) -> dict:
    reader = csv.DictReader(io.StringIO(content))

    if reader.fieldnames is None:
        raise ValueError("CSV file has no header")

    # Handle optional UTF-8 BOM.
    reader.fieldnames = [
        name.lstrip("\ufeff").strip()
        for name in reader.fieldnames
    ]

    headers = set(reader.fieldnames)

    missing = REQUIRED_COLUMNS - headers

    if missing:
        raise ValueError(
            "Missing required columns: "
            + ", ".join(sorted(missing))
        )

    if len(reader.fieldnames) != len(headers):
        raise ValueError("Duplicate CSV column names")

    unexpected = headers - REQUIRED_COLUMNS - OPTIONAL_COLUMNS

    if unexpected:
        raise ValueError(
            "Unexpected columns: "
            + ", ".join(sorted(unexpected))
        )

    valid_rows = []
    errors = []

    seen_fleet_ids = set()
    seen_registrations = set()

    for row_number, row in enumerate(reader, start=2):
        if row_number > MAX_IMPORT_ROWS + 1:
            raise ValueError(
                f"CSV exceeds {MAX_IMPORT_ROWS} vehicle records"
            )

        # Detect malformed rows with extra columns.
        if None in row:
            errors.append({
                "row": row_number,
                "errors": ["Too many columns"],
            })
            continue

        normalized = {
            key: value.strip() if isinstance(value, str) else value
            for key, value in row.items()
        }

        # Optional blank VIN becomes None.
        if not normalized.get("vin"):
            normalized["vin"] = None

        # Use Pydantic defaults for blank optional fields.
        for optional_field in (
            "battery_level",
            "telemetry_source",
        ):
            if normalized.get(optional_field) in ("", None):
                normalized.pop(optional_field, None)

        try:
            vehicle = VehicleCreate.model_validate(normalized)
        except ValidationError as exc:
            errors.append({
                "row": row_number,
                "errors": [
                    {
                        "field": ".".join(
                            str(part) for part in issue["loc"]
                        ),
                        "message": issue["msg"],
                    }
                    for issue in exc.errors()
                ],
            })
            continue

        fleet_id = vehicle.fleet_id.strip().upper()
        registration = (
            vehicle.registration_number.strip().upper()
        )

        row_errors = []

        if fleet_id in seen_fleet_ids:
            row_errors.append("Duplicate fleet_id in CSV")

        if registration in seen_registrations:
            row_errors.append(
                "Duplicate registration_number in CSV"
            )

        # Reserve identifiers even if another field in this
        # otherwise valid row causes a duplicate error.
        seen_fleet_ids.add(fleet_id)
        seen_registrations.add(registration)

        if row_errors:
            errors.append({
                "row": row_number,
                "errors": row_errors,
            })
            continue

        valid_rows.append({
            "row": row_number,
            "vehicle": vehicle.model_dump(),
        })

    return {
        "total_rows": len(valid_rows) + len(errors),
        "valid_count": len(valid_rows),
        "error_count": len(errors),
        "valid_rows": valid_rows,
        "errors": errors,
    }
