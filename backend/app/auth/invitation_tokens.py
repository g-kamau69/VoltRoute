
import hashlib
import secrets


def generate_invitation_token() -> str:
    """
    Generate a cryptographically secure invitation token.
    """
    return secrets.token_urlsafe(32)


def hash_invitation_token(token: str) -> str:
    """
    Hash an invitation token for secure database storage.
    """
    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()
