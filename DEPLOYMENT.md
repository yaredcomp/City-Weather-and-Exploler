# CI/CD Pipeline Quick Start

Your GitHub Actions + Vercel GitOps pipeline is now configured!

## 🚀 Quick Setup (5 minutes)

### 1. Add GitHub Secrets

Go to **Settings → Secrets and variables → Actions** and add:

```
VERCEL_TOKEN         = <your-token-from-vercel>
VERCEL_ORG_ID        = <your-vercel-org-id>
VERCEL_PROJECT_ID    = <your-vercel-project-id>
```

Get these values from Vercel: https://vercel.com/account/tokens

### 2. Test the Pipeline

```bash
# Create a test branch
git checkout -b test/pipeline

# Make a change
echo "# Test" >> README.md

# Commit and push
git add . && git commit -m "test" && git push -u origin test/pipeline

# Open a PR to main in GitHub
# Watch: Actions → CI Pipeline running tests, lint, build
# Watch: Vercel preview deployment link in PR comments
```

### 3. Deploy to Production

```bash
# Merge your PR to main
# GitHub Actions automatically deploys to Vercel production
# Check: Actions → Deploy to Production workflow
```

## 📁 What Was Created

```
.github/
├── workflows/
│   ├── ci.yml                    # Lint, test, build on every push
│   ├── deploy-staging.yml        # Auto-deploy to staging
│   └── deploy-production.yml     # Auto-deploy to production
├── config/
│   ├── deployment-config.yml     # GitOps deployment rules
│   └── environments/
│       ├── development.env       # Dev environment vars
│       ├── staging.env           # Staging environment vars
│       └── production.env        # Production environment vars
└── SETUP.md                      # Detailed setup guide

vercel.json                        # Vercel configuration
.gitignore                         # Updated to allow CI/CD configs
```

## 🔄 Pipeline Flow

```
Push to GitHub
    ↓
CI Runs: Lint → Test → Build
    ↓
✓ All Pass?
    ├─ YES → Merge to main → Deploy to Production
    └─ NO  → PR Blocked (fix issues)
```

## 🔐 Environment Variables (GitOps Style)

- **Non-sensitive vars**: Stored in `.github/config/environments/*.env` (committed to git)
- **Sensitive vars**: Stored in GitHub Secrets (not in git)

Example:

```bash
# In git (safe)
NEXT_PUBLIC_ENV=production
LLM_PROVIDER=openrouter

# In GitHub Secrets (confidential)
OPENROUTER_API_KEY=sk-...
PEXELS_API_KEY=...
```

## 📊 Deploy to Multiple Environments

| Branch      | Environment | Auto Deploy | URL                                      |
| ----------- | ----------- | ----------- | ---------------------------------------- |
| `main`      | Production  | ✅          | `agentic-weather-app.vercel.app`         |
| `staging`   | Staging     | ✅          | `agentic-weather-app-staging.vercel.app` |
| `develop`   | Development | ✅          | Local dev                                |
| `feature/*` | Preview     | ✅          | `agentic-weather-app-[hash].vercel.app`  |

## 🔗 Useful Links

- **GitHub Actions**: Go to Actions tab → See all workflow runs
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Deployment History**: Repository → Deployments tab

## 📝 Next Steps

1. ✅ Create GitHub Secrets (VERCEL_TOKEN, etc.)
2. ✅ Test with a PR to main
3. ✅ Merge to main and watch production deploy
4. ✅ (Optional) Set up Slack notifications

## ⚠️ Important Notes

- **First deployment**: Will fail if secrets aren't set. Add them and retry.
- **Branch protection**: `main` branch requires PR + all checks passing
- **Rollback**: Old deployments visible in Vercel dashboard (can redeploy old versions)

## 🆘 Troubleshooting

**CI Fails:** Check Actions logs for error details
**Deploy Fails:** Verify VERCEL_TOKEN and project ID in GitHub Secrets
**Preview not appearing:** Ensure Vercel GitHub app is installed in repo

---

For detailed setup instructions, see [`.github/SETUP.md`](.github/SETUP.md)
