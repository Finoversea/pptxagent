# Branch Strategy

This project follows a modified GitFlow branching strategy.

## Branch Types

| Branch Type | Naming Convention | Purpose | Merge Target |
|-------------|-------------------|---------|--------------|
| `main` | `main` | Production releases, stable code | - |
| `develop` | `develop` | Integration branch for features | `main` (via release) |
| `feature` | `feature/<name>` | New feature development | `develop` |
| `bugfix` | `bugfix/<name>` | Bug fixes for develop | `develop` |
| `hotfix` | `hotfix/<name>` | Urgent production fixes | `main` AND `develop` |
| `release` | `release/<version>` | Release preparation | `main` (tagged) |

## Workflow

### Feature Development

1. Create feature branch from `develop`:
   ```bash
   git checkout develop
   git checkout -b feature/add-chart-support
   ```

2. Develop and commit changes
3. Merge back to `develop`:
   ```bash
   git checkout develop
   git merge feature/add-chart-support
   git branch -d feature/add-chart-support
   ```

### Release Process

1. Create release branch from `develop`:
   ```bash
   git checkout develop
   git checkout -b release/0.1.0
   ```

2. Finalize release (version bumps, changelog)
3. Merge to `main` and tag:
   ```bash
   git checkout main
   git merge release/0.1.0
   git tag -a v0.1.0 -m "Release v0.1.0"
   ```

4. Merge back to `develop`:
   ```bash
   git checkout develop
   git merge release/0.1.0
   git branch -d release/0.1.0
   ```

### Hotfix Process

1. Create hotfix branch from `main`:
   ```bash
   git checkout main
   git checkout -b hotfix/fix-export-crash
   ```

2. Fix and test
3. Merge to `main` and tag:
   ```bash
   git checkout main
   git merge hotfix/fix-export-crash
   git tag -a v0.1.1 -m "Hotfix v0.1.1"
   ```

4. Merge to `develop`:
   ```bash
   git checkout develop
   git merge hotfix/fix-export-crash
   git branch -d hotfix/fix-export-crash
   ```

## Branch Protection

- `main`: Requires PR approval, no direct commits
- `develop`: Requires PR approval for non-trivial changes

## Initial Setup

After clone:
```bash
git checkout main
git checkout -b develop
git push -u origin develop
```