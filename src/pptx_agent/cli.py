"""CLI interface for PPTX Agent."""

import argparse
import sys

from pptx_agent import __version__


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="AI-powered PowerPoint presentation generator"
    )
    parser.add_argument("--version", action="version", version=f"pptx-agent {__version__}")
    parser.add_argument("prompt", nargs="?", help="Prompt for slide generation")
    
    args = parser.parse_args()
    
    if args.prompt:
        print(f"Generating presentation for: {args.prompt}")
        # TODO: Implement actual generation
        print("(Not yet implemented - framework ready)")
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
