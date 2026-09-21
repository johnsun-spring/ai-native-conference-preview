# AI Native Conference Website

Static website code for [conference.springlabs.com](https://conference.springlabs.com).

## Development

Start a local server from the project root:

```bash
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

> **Note:** The CSS and JS source files are minified in-place by the build step. After running a build, the source files will contain minified output — re-edit the originals before running the build again, or work from a clean checkout.

## Build

The build step minifies CSS and JS files in-place using `clean-css` and `terser`. It targets both the root site and the `ai-native-conference-2025/` subdirectory. Run it before committing changes that will be deployed.

### Prerequisites

Node.js v24 and npm are required (one-time setup):

```bash
npm install
```

### Running the build

```bash
npm run build
```

### What the build does

| Step | What happens |
|------|-------------|
| **Minify CSS** | Minifies `css/normalize.css`, `css/webflow.css`, and `css/aibf-conference.webflow.css` in-place (also the equivalent files in `ai-native-conference-2025/css/`) |
| **Minify JS** | Minifies `js/content-loader.js` and `js/webflow.js` in-place (also `ai-native-conference-2025/js/webflow.js`) |

The build is **idempotent** — running it multiple times produces the same result.

## File structure

```
/
├── css/
│   ├── normalize.css
│   ├── webflow.css
│   └── aibf-conference.webflow.css
├── data/
│   ├── agenda.json
│   ├── speakers.json
│   └── sponsors.json
├── documents/                  # PDFs and Lottie animation assets
├── fonts/                      # Self-hosted font files (woff2)
├── images/
├── js/
│   ├── webflow.js              # Webflow bundle
│   └── content-loader.js       # Dynamic content loading + nav behavior
├── scripts/
│   └── extract_speakers.py     # Utility script for data extraction
├── ai-native-conference-2025/  # 2025 edition sub-site (own css/, js/, images/, html pages)
├── build.js                    # Build script
├── package.json
├── index.html                  # Homepage
└── *.html                      # Additional root-level pages
```

## Adding a new page

1. Create the HTML file in the appropriate directory
2. Reference the shared CSS and JS as needed:
   ```html
   <link rel="stylesheet" href="css/aibf-conference.webflow.css">
   <!-- ... page content ... -->
   <script src="js/content-loader.js"></script>
   ```
3. Run `npm run build` before committing

## Deploying

[![Deploy to GitHub Pages](https://github.com/springlabs/website-ai-native-conference/actions/workflows/deploy.yml/badge.svg)](https://github.com/springlabs/website-ai-native-conference/actions/workflows/deploy.yml)

Deployment to GitHub Pages ([conference.springlabs.com](https://conference.springlabs.com)) is handled automatically by the GitHub Actions workflow at `.github/workflows/deploy.yml`.

### How it works

1. **Trigger** — the workflow runs on every push to `main`, or can be triggered manually from the **Actions** tab in GitHub.
2. **Build job** — checks out the repo, installs Node dependencies (using the version in `.nvmrc`), runs `npm run build`, then uploads the repo root as a Pages artifact.
3. **Deploy job** — targets the `github-pages` environment, which has required approvers configured (repo → Settings → Environments → `github-pages`). A required approver must approve the deployment in the Actions tab before it proceeds. Once approved, the job deploys the artifact to GitHub Pages via `actions/deploy-pages`.

If two pushes land in quick succession, the workflow cancels the older in-progress run so the latest commit always wins.

> **Custom domain** — `conference.springlabs.com` is configured in the GitHub Pages settings UI (repo → Settings → Pages). No `CNAME` file is required.

### To deploy

Just merge a PR to `main`.

GitHub Actions starts the workflow automatically. You can monitor progress in the **Actions** tab.

### Other workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Pull requests | Runs the build to verify nothing is broken |
| `links.yml` | Schedule / manual | Checks for broken internal and external links |
| `pr-title.yml` | Pull requests | Lints PR titles for consistency |
