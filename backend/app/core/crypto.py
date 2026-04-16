"""Token encryption/decryption using Fernet symmetric encryption.

Usage:
    from app.core.crypto import encrypt_token, decrypt_token

    # Encrypt before saving to DB
    hotel.telegram_bot_token = encrypt_token(raw_token)

    # Decrypt when reading from DB for API calls
    real_token = decrypt_token(hotel.telegram_bot_token)

If TOKEN_ENCRYPTION_KEY is not set, functions pass through plaintext (dev mode).
"""

from cryptography.fernet import Fernet, InvalidToken
from .config import settings

_fernet = None
_encryption_enabled = False


def _get_fernet() -> Fernet:
    global _fernet, _encryption_enabled
    if _fernet is None:
        key = settings.TOKEN_ENCRYPTION_KEY
        if not key:
            _encryption_enabled = False
            return None
        _fernet = Fernet(key.encode() if isinstance(key, str) else key)
        _encryption_enabled = True
    return _fernet


def encrypt_token(plaintext: str) -> str:
    """Encrypt a token string. Returns base64-encoded ciphertext."""
    if not plaintext:
        return plaintext
    f = _get_fernet()
    if not f:
        return plaintext  # No key configured — store plaintext (dev mode)
    return f.encrypt(plaintext.encode()).decode()


def decrypt_token(ciphertext: str) -> str:
    """Decrypt a token string. Returns plaintext. Handles unencrypted legacy data."""
    if not ciphertext:
        return ciphertext
    f = _get_fernet()
    if not f:
        return ciphertext  # No key configured — return as-is
    try:
        return f.decrypt(ciphertext.encode()).decode()
    except (InvalidToken, Exception):
        # Fallback: token stored unencrypted (pre-migration data)
        return ciphertext
