# Contributing

## Pull Request Process

1. Create a pull request.
1. Address comments and checklist items.
1. When you are ready to merge your PR, ensure that the commit message is the PR title.

## Pull Request Title Format

`<type>: [<jira ticket ID>] short description`

See below for a list of Conventional Commit types.

Example.

`feat: [DEV-XXX] add this feature`

To generate changelog, pull requests or commits must start with a [conventional commit] type

- `build:` for build system changes (webpack, package.json, etc.)
- `chore:` for routine maintenance that doesn't modify workflow logic (e.g. renaming files, housekeeping)
- `ci:` for CI/CD pipeline changes (GitHub Actions workflows, etc.)
- `docs:` for documentation and examples
- `feat:` for new features
- `fix:` for bug fixes
- `infra:` for infrastructure changes (e.g. Terraform, CloudFormation)
- `perf:` for performance improvements that don't change behavior (e.g. caching, reducing steps)
- `refactor:` for code refactoring, neither fixes a bug or adds a feature
- `revert:` for reverting a previous commit
- `style:` for white-space, formatting, missing semi-colons, etc.
- `test:` for tests

[conventional commit]: https://www.conventionalcommits.org/en/v1.0.0/
