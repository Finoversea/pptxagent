"""Test package initialization."""

import pytest


def test_package_import():
    """Test that the package can be imported."""
    from pptx_agent import __version__
    assert __version__ == "0.1.0"


def test_pptx_library_available():
    """Test that python-pptx is available."""
    from pptx import Presentation
    prs = Presentation()
    assert prs is not None
