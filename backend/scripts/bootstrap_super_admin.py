
import sys
from pathlib import Path
from getpass import getpass

from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR))

from app.database import SessionLocal
from app.models.platform_admin import PlatformAdmin
from app.security import hash_password


def main():
    print("\nVoltRoute — Initial Super Admin Setup")
    print("------------------------------------")

    full_name = input("Full name: ").strip()
    email = input("Email address: ").strip().lower()

    if not full_name or not email or "@" not in email:
        print("Invalid name or email address.")
        return

    password = getpass("Password: ")
    confirm_password = getpass("Confirm password: ")

    if password != confirm_password:
        print("Passwords do not match.")
        return

    if len(password) < 12:
        print("Password must contain at least 12 characters.")
        return

    password_hash = hash_password(password)

    try:
        with SessionLocal.begin() as db:

            # Prevent simultaneous bootstrap operations.
            db.execute(
                text("SELECT pg_advisory_xact_lock(728314, 1)")
            )

            # Check for an existing administrator
            # inside the active transaction.
            existing_admin = db.scalar(
                select(PlatformAdmin.id).limit(1)
            )

            if existing_admin is not None:
                print(
                    "Bootstrap cancelled: a platform "
                    "administrator already exists."
                )
                return

            admin = PlatformAdmin(
                full_name=full_name,
                email=email,
                password_hash=password_hash,
                role="super_admin",
                is_active=True
            )

            db.add(admin)
            db.flush()

        print("\nSuper Admin account created successfully.")

    except IntegrityError:
        print(
            "Account creation failed because of "
            "a database uniqueness constraint."
        )

    except SQLAlchemyError as exc:
        print(
            f"Database operation failed: "
            f"{type(exc).__name__}"
        )


if __name__ == "__main__":
    main()
