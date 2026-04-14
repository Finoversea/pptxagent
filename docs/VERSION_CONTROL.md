# Version Control Strategy

## Branch Strategy

### Main Branches

| Branch | Purpose | Protection |
|--------|---------|------------|
| `main` | Production releases | Protected, requires PR approval |
| `develop` | Integration branch for features | Protected, requires PR |

### Feature Branches

Naming convention: `feature/<issue-number>-<short-description>`

Examples:
- `feature/YCG-42-cli-interface`
- `feature/YCG-43-slide-generator`

### Release Branches

Naming convention: `release/v<version>`

Examples:
- `release/v1.0.0`

### Hotfix Branches

Naming convention: `hotfix/<issue-number>-<short-description>`

## Version Tagging Convention

Follow Semantic Versioning (MAJOR.MINOR.PATCH):

| Version | When to increment |
|---------|-------------------|
| MAJOR | Breaking API changes |
| MINOR | New features, backward compatible |
| PATCH | Bug fixes |

### Tag Format

- `v1.0.0` - Initial release
- `v1.1.0` - New feature added
- `v1.1.1` - Bug fix

### Tagging Process

```bash
# Create and push a release tag
git tag -a v1.0.0 -m "Release v1.0.0: Initial CLI MVP"
git push origin v1.0.0
```

## Merge Workflow

1. Create feature branch from `develop`
2. Develop and test feature
3. Create PR to merge into `develop`
4. After approval, merge to `develop`
5. When ready for release, merge `develop` to `main`
6. Tag release on `main`

## Branch Protection Rules (GitHub)

For `main` branch:
- Require pull request reviews (1 approval)
- Require status checks to pass (CI)
- Require branches to be up to date

For `develop` branch:
- Require pull request reviews (1 approval)
- Require status checks to pass (CI)