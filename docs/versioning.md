# Version Tagging Convention

This document defines the version tagging strategy for PPTX Agent.

## Version Format

We follow [Semantic Versioning](https://semver.org/) (MAJOR.MINOR.PATCH):

```
vMAJOR.MINOR.PATCH
```

Example: `v1.2.3`

## Version Components

| Component | Increment When | Example |
|-----------|----------------|---------|
| MAJOR | Breaking changes, API redesign | v1.0.0 → v2.0.0 |
| MINOR | New features, backwards compatible | v1.0.0 → v1.1.0 |
| PATCH | Bug fixes, minor improvements | v1.0.0 → v1.0.1 |

## Tag Naming

- Always prefix with `v`: `v0.1.0`, not `0.1.0`
- Use lowercase `v`
- No spaces or special characters

## Creating Tags

### Annotated Tags (Recommended)

```bash
git tag -a v1.0.0 -m "Release v1.0.0: First stable release

Features:
- CLI interface
- Basic slide generation
- Template support

Fixes:
- Chart rendering issues
"
```

### Lightweight Tags (Development only)

```bash
git tag v1.0.0-dev
```

## Tag Lifecycle

1. **Pre-release tags**: `v1.0.0-alpha`, `v1.0.0-beta`, `v1.0.0-rc.1`
2. **Release tag**: `v1.0.0` (annotated, on `main`)
3. **Post-release fixes**: `v1.0.1`, `v1.0.2`, etc.

## Pushing Tags

```bash
# Push single tag
git push origin v1.0.0

# Push all tags (use sparingly)
git push origin --tags
```

## Tag Protection

- Production tags on `main` must be annotated
- Never delete published tags without team coordination
- Use `git tag -d <tag>` locally, `git push --delete origin <tag>` remotely

## Version File

Maintain a `VERSION` file in the repository root:

```
0.1.0
```

Update this file during release preparation.

## Changelog

Maintain `CHANGELOG.md` with version history:

```markdown
## [0.1.0] - 2026-04-14

### Added
- Initial CLI implementation
- Basic slide generation

### Fixed
- PPTX export stability
```

## CI/CD Integration

Tags trigger:
- GitHub Release creation
- PyPI package publishing (for stable releases)
- Docker image builds (if applicable)