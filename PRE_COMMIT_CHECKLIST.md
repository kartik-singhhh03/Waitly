# Pre-Commit Checklist

## ✅ Before Every Commit

Run these checks to ensure no secrets are committed:

### 1. Check for Staged .env Files
```bash
git status
# Make sure no .env files appear in "Changes to be committed"
```

### 2. Search for Hardcoded Secrets
```bash
# Database URLs
git diff --cached | grep -i "postgresql://.*@"

# API Keys
git diff --cached | grep -i "api.*key.*="

# Passwords
git diff --cached | grep -i "password.*="

# JWT Secrets
git diff --cached | grep -i "jwt.*secret.*="
```

### 3. Verify .gitignore is Working
```bash
# Should show nothing if .env is properly ignored
git status --ignored | grep "\.env"
```

### 4. Review All Staged Files
```bash
git diff --cached --name-only
# Review each file to ensure no secrets
```

## 🚨 If You Find Secrets

1. **Unstage the file:**
   ```bash
   git reset HEAD <file>
   ```

2. **Remove from working directory if needed:**
   ```bash
   # Only if you want to remove it completely
   rm <file>
   ```

3. **Add to .gitignore if not already there**

4. **Re-commit without the secret**

## ✅ Safe to Commit

- ✅ Source code files
- ✅ `.env.example` files (with placeholders)
- ✅ Documentation (without real credentials)
- ✅ Configuration files (without secrets)
- ✅ Test files

## ❌ Never Commit

- ❌ `.env` files
- ❌ `server/.env` files
- ❌ Database connection strings
- ❌ API keys
- ❌ JWT secrets
- ❌ Passwords
- ❌ Private keys (`.pem`, `.key`)

## Quick Pre-Commit Script

Save this as `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Check for .env files
if git diff --cached --name-only | grep -E "\.env$|\.env\."; then
    echo "❌ ERROR: Attempting to commit .env file!"
    echo "Please unstage .env files before committing."
    exit 1
fi

# Check for hardcoded database URLs
if git diff --cached | grep -i "postgresql://.*@.*:"; then
    echo "❌ ERROR: Found hardcoded database URL!"
    echo "Please use environment variables instead."
    exit 1
fi

echo "✅ Pre-commit checks passed"
exit 0
```

Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

