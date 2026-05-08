# CI/CD Pipeline Setup Guide

This guide walks you through setting up the CI/CD pipeline with GitHub Actions and Vercel.

## Prerequisites

- GitHub account with admin access to this repository
- Vercel account (free tier is sufficient)
- Optional: Slack workspace (for notifications)

## Step 1: Connect Repository to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Import Project" or go to Dashboard > Add New > Project
3. Select "Import Git Repository"
4. Select this GitHub repository
5. Fill in the project settings:
   - **Project Name**: `agentic-weather-app` (or your preferred name)
   - **Framework**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
6. Click "Deploy"

After deployment completes:
- Note your **Vercel Organization ID** (from account settings)
- Note your **Vercel Project ID** (from project settings)
- Create a **Vercel Token** (Settings > Tokens > Create)

## Step 2: Configure GitHub Secrets

Go to your GitHub repository:
1. **Settings** > **Secrets and Variables** > **Actions**
2. Add the following secrets:

### Required Secrets

| Secret Name | Value | Source |
|---|---|---|
| `VERCEL_TOKEN` | Your Vercel authentication token | Vercel Dashboard > Settings > Tokens |
| `VERCEL_ORG_ID` | Your Vercel Organization ID | Vercel Dashboard > Settings > General |
| `VERCEL_PROJECT_ID` | Your Vercel Project ID | Vercel Project > Settings > General |

### Optional API Secrets

| Secret Name | Value | Notes |
|---|---|---|
| `PEXELS_API_KEY` | Your Pexels API key | https://www.pexels.com/api/ - enables real city images |
| `LLM_PROVIDER` | `ollama`, `openrouter`, or `groq` | Defaults to `ollama` (local) |
| `OPENROUTER_API_KEY` | Your OpenRouter API key | https://openrouter.ai - required if using OpenRouter |
| `GROQ_API_KEY` | Your Groq API key | https://console.groq.com - required if using Groq |
| `NEXT_PUBLIC_API_URL` | Your app URL | e.g., `https://agentic-weather-app.vercel.app` |

## Step 3: Configure Branch Protection Rules

In GitHub repository settings:

1. **Settings** > **Branches** > **Branch Protection Rules**
2. Click "Add rule"
3. Create rule for `main` branch:
   - Pattern: `main`
   - Require pull request reviews before merging: ✓
   - Require status checks to pass: ✓
   - Require branches to be up to date: ✓
   - Dismiss stale pull request approvals: ✗
4. Create rule for `staging` branch:
   - Pattern: `staging`
   - Require status checks to pass: ✓

## Step 4: Create Environment Branches

```bash
# Create staging branch from main
git checkout -b staging main
git push -u origin staging

# Create develop branch for feature work
git checkout -b develop main
git push -u origin develop
```

## Step 5: Test the Pipeline

### Test CI (Lint, Tests, Build)

```bash
# Create a feature branch
git checkout -b test/ci-pipeline

# Make a trivial change
echo "# Test CI" >> README.md

# Commit and push
git add .
git commit -m "test: verify CI pipeline"
git push -u origin test/ci-pipeline

# Go to GitHub > Actions to see CI running
# You should see: Lint, Tests, Build all passing
```

### Test Preview Deployment

```bash
# Create a pull request from test/ci-pipeline to main
# Go to GitHub > Pull Requests > Your PR
# Wait for CI to pass, then look for Vercel preview comment
# Preview URL will be: https://agentic-weather-app-[hash].vercel.app
```

### Test Staging Deployment

```bash
# Merge PR to main
# Push to staging branch
git checkout staging
git pull origin main
git push origin staging

# Go to GitHub > Actions > Deploy to Staging
# Watch deployment complete to staging environment
# URL: https://agentic-weather-app-staging.vercel.app
```

### Test Production Deployment

```bash
# Merge to main (if not already merged)
# Go to GitHub > Actions > Deploy to Production
# Watch deployment complete to production environment
# URL: https://agentic-weather-app.vercel.app
```

## Pipeline Overview

### On Every Push/PR to develop or main

**CI Pipeline** (`ci.yml`):
1. ✅ Lint (ESLint)
2. ✅ Test (Jest)
3. ✅ Build (Next.js)

### On PR to main or staging

**Preview Deployment** (Vercel automatic):
- Automatically creates preview deployment
- Comment posted with preview URL
- Comments with automatic status updates

### On Merge to staging

**Staging Deployment** (`deploy-staging.yml`):
1. Builds application
2. Deploys to Vercel (staging project)
3. Posts deployment comment in PR

### On Merge to main

**Production Deployment** (`deploy-production.yml`):
1. Builds application
2. Deploys to Vercel (production project)
3. Updates deployment status

## GitOps Configuration Files

### `.github/config/deployment-config.yml`
Defines branch-to-environment mapping, approval requirements, and deployment strategies. This is the single source of truth for deployment rules.

### `.github/config/environments/*.env`
Environment-specific configuration (non-sensitive only). Sensitive values are managed through GitHub Secrets and Vercel environment variables.

## Monitoring & Troubleshooting

### View Deployment History
1. Go to repository **Deployments** tab
2. See all production and staging deployments
3. Click on any deployment to see details and logs

### View CI Logs
1. Go to **Actions** tab
2. Click on the workflow run
3. Click on the failed job to see detailed logs

### Common Issues

**Deployment fails with "VERCEL_TOKEN invalid"**
- Verify token in GitHub Secrets is correct and not expired
- Create a new token from Vercel dashboard

**Tests failing in CI but passing locally**
- Ensure node_modules are cached correctly
- Check for environment-specific issues
- Try: `npm ci` instead of `npm install` (cleaner install)

**Preview deployment not appearing**
- Ensure `.github/workflows/deploy-preview.yml` exists
- Vercel integration must be installed in GitHub app
- Check Vercel project is correctly linked

## Next Steps

1. **Set up Slack notifications** (optional):
   - Add `SLACK_WEBHOOK` secret to GitHub
   - Uncomment Slack section in `deployment-config.yml`

2. **Add monitoring and alerting**:
   - Integrate with Sentry for error tracking
   - Add health checks to production deployment

3. **Set up automatic rollbacks**:
   - Configure in `deployment-config.yml`
   - Test rollback by reverting a commit

## Support

For issues or questions:
- Check GitHub Actions logs: Repository > Actions > [Workflow] > [Run]
- Check Vercel logs: Project > Deployments > [Deployment]
- Review this guide's Troubleshooting section

---

**Deployment Flow Summary:**

```
Feature Branch (develop)
         ↓
    Create PR to main
         ↓
   CI Pipeline Runs
   (Lint, Test, Build)
         ↓
  Vercel Preview Deploy
         ↓
   Code Review & Approve
         ↓
   Merge to main
         ↓
  Production Deploy
         ↓
   Live on Vercel! 🎉
```
