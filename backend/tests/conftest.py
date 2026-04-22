"""Pytest config for backend tests.

Adds `backend/` to sys.path so `from app.services...` works when pytest
is invoked from the repo root.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.dirname(HERE)
if BACKEND not in sys.path:
    sys.path.insert(0, BACKEND)
