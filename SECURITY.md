# Security Guidelines

## ⚠️ Important: Never Commit Secrets

This repository is configured to prevent committing sensitive information. Follow these guidelines:

## Environment Variables

### Frontend (.env)
- `VITE_API_URL` - Your backend API URL

### Backend (server/.env)
- `DATABASE_URL` - PostgreSQL connection string (NEVER commit this!)
- `JWT_SECRET` - Secret key for JWT tokens (NEVER commit this!)
- `FRONTEND_URL` - Frontend URL for CORS
- `NODE_ENV` - Environment (development/production)

## Files That Are Gitignored

The following files are automatically ignored by Git:
- `.env` and `.env.*` files
- `server/.env` and `server/.env.*` files
- `*.pem`, `*.key`, `*.cert` files
- `secrets/` and `credentials/` directories
- Any file with `.secret` extension

## Before Committing

1. ✅ Check that no `.env` files are staged
2. ✅ Verify no hardcoded secrets in code
3. ✅ Ensure database URLs are in `.env.example` only (with placeholders)
4. ✅ Review `git status` before pushing

## Generating Secrets

### JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Database URL
Get from your Neon dashboard - never hardcode it!

## Production Checklist

- [ ] All environment variables set in deployment platform
- [ ] JWT_SECRET is a strong random string
- [ ] DATABASE_URL is correct and secure
- [ ] CORS is configured correctly
- [ ] Rate limiting is enabled
- [ ] HTTPS is enabled
- [ ] No default secrets in production

## If You Accidentally Commit Secrets

1. **Immediately rotate the secret** (change password, regenerate key, etc.)
2. Remove from Git history:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch path/to/file" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. Force push (coordinate with team first!)
4. Consider the secret compromised

## Security Best Practices

1. Use strong, randomly generated secrets
2. Never share secrets in chat, email, or documentation
3. Use different secrets for development and production
4. Rotate secrets regularly
5. Use environment variables, never hardcode
6. Review access logs regularly

