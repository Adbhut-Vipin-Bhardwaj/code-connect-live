"""Utility functions."""

import random


def generate_avatar_url(name: str) -> str:
    """Generate a placeholder avatar URL based on the name."""
    return f"https://api.dicebear.com/7.x/avataaars/svg?seed={name}"


def generate_color() -> str:
    """Generate a random hex color for cursor display."""
    colors = [
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A",
        "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2"
    ]
    return random.choice(colors)
