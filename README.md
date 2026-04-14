# PPTX Agent

A CLI tool for generating PowerPoint presentations using AI agents.

## Overview

PPTX Agent converts structured prompts into professional PPTX files using python-pptx.

## Architecture

```
USER → CLAUDE AGENT → SLIDE JSON → PPTX EXPORT
```

## Installation

```bash
pip install -e .
```

## Usage

```bash
pptx-agent "Create a 5-slide pitch deck for a fintech startup"
```

## Project Structure

```
pptxagent/
├── src/
│   └── pptx_agent/
│       ├── __init__.py
│       ├── cli.py
│       ├── generator.py
│       └── templates/
├── tests/
├── docs/
└── .github/
    └── workflows/
```

## License

MIT
