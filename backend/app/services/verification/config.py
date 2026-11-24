
import os


def mock_verification_enabled() -> bool:
    """
    Enable mock verification only when explicitly configured
    for local development.
    """

    environment = os.getenv(
        "VOLTROUTE_ENV",
        "production",
    ).strip().lower()

    enabled = os.getenv(
        "VOLTROUTE_ENABLE_MOCK_VERIFICATION",
        "false",
    ).strip().lower()

    return (
        environment == "development"
        and enabled == "true"
    )
