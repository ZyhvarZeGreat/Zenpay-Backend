# Development Guide

## 🚀 Running the Server with Nodemon

Nodemon automatically restarts the server when you make changes to your code.

### Start Development Server

```bash
cd backend
npm run dev
```

This will:
- ✅ Watch for file changes in `src/` directory
- ✅ Auto-restart server on changes
- ✅ Show colored output
- ✅ Reload environment variables
- ✅ Watch Prisma schema changes

### Start Test Server (Simplified)

```bash
npm run dev:test
```

Uses `test-server.js` for quick testing without full database setup.

### Start with Debugger

```bash
npm run dev:inspect
```

Then attach your debugger to port 9229.

## 📝 Nodemon Configuration

Configuration is in `nodemon.json`:

```json
{
  "watch": ["src", "prisma/schema.prisma", ".env"],
  "ext": "js,json,prisma",
  "ignore": ["node_modules", "logs", "uploads"],
  "delay": 1000
}
```

### Watched Files

Nodemon watches these files and restarts on changes:
- All `.js` files in `src/`
- `prisma/schema.prisma`
- `.env` file
- All `.json` config files

### Ignored Files

These won't trigger restart:
- `node_modules/`
- `logs/`
- `uploads/`
- Test files (`*.test.js`, `*.spec.js`)

## 🎯 Development Workflow

### 1. Start Server

```bash
npm run dev
```

You'll see:
```
[nodemon] 3.0.2
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): src/**/* prisma/schema.prisma .env
[nodemon] watching extensions: js,json,prisma
[nodemon] starting `node src/index.js`
✅ Server running on port 5000
```

### 2. Make Changes

Edit any file in `src/` and save. Nodemon will automatically:
```
[nodemon] restarting due to changes...
[nodemon] starting `node src/index.js`
✅ Server running on port 5000
```

### 3. Manual Restart

Type `rs` and press Enter to manually restart:
```
rs
[nodemon] restarting due to `rs` command
```

### 4. Stop Server

Press `Ctrl+C` to stop:
```
^C[nodemon] gracefully shutting down
```

## 🛠 Development Commands

### Backend Development

```bash
# Start with nodemon (recommended)
npm run dev

# Start without nodemon
npm start

# Start test server
npm run dev:test

# Start with debugging
npm run dev:inspect
```

### Database Development

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Open Prisma Studio (GUI)
npm run prisma:studio

# Seed database
npm run prisma:seed
```

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm test -- --coverage
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🔥 Hot Reload Features

### What Reloads Automatically?

✅ **Route changes** - Add/modify routes
✅ **Controller logic** - Update business logic
✅ **Service changes** - Modify services
✅ **Middleware updates** - Change middleware
✅ **Config changes** - Update `.env` file
✅ **Schema changes** - Modify Prisma schema

### What Doesn't Reload?

❌ **node_modules** - Need to restart manually
❌ **package.json** - Need to `npm install` again
❌ **Compiled contracts** - Need to recompile
❌ **Database schema** - Need migration

## 📊 Monitoring Changes

Nodemon shows which files triggered the restart:

```bash
[nodemon] restarting due to changes...
[nodemon] src/controllers/paymentController.js
[nodemon] starting `node src/index.js`
```

## 🐛 Debugging

### VS Code Debug Configuration

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug with Nodemon",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev:inspect"],
      "port": 9229,
      "restart": true,
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Chrome DevTools

1. Start with inspect:
   ```bash
   npm run dev:inspect
   ```

2. Open Chrome and go to:
   ```
   chrome://inspect
   ```

3. Click "inspect" under your Node.js process

## 💡 Tips & Tricks

### Custom Restart Delay

Increase delay if files save slowly:

```json
// nodemon.json
{
  "delay": 2000
}
```

### Watch Additional Directories

```json
// nodemon.json
{
  "watch": [
    "src",
    "config",
    "utils"
  ]
}
```

### Ignore Specific Files

```json
// nodemon.json
{
  "ignore": [
    "src/temp/*",
    "src/*.backup.js"
  ]
}
```

### Environment-Specific Config

```bash
# Development
NODE_ENV=development npm run dev

# Staging
NODE_ENV=staging npm run dev

# Test
NODE_ENV=test npm run dev:test
```

## 🔄 Common Development Scenarios

### Scenario 1: Update API Endpoint

1. Edit `src/routes/paymentRoutes.js`
2. Save file
3. Nodemon automatically restarts ✅
4. Test: `curl http://localhost:5000/api/v1/payments`

### Scenario 2: Add New Service

1. Create `src/services/newService.js`
2. Save file
3. Nodemon detects new file and restarts ✅
4. Import and use in controller

### Scenario 3: Update Environment Variable

1. Edit `.env` file
2. Save file
3. Nodemon automatically restarts ✅
4. New values loaded

### Scenario 4: Update Prisma Schema

1. Edit `prisma/schema.prisma`
2. Save file
3. Nodemon restarts ✅
4. Run migration: `npm run prisma:migrate`
5. Nodemon restarts again ✅

### Scenario 5: Database Migration

```bash
# In one terminal: Keep dev server running
npm run dev

# In another terminal: Run migration
npm run prisma:migrate

# First terminal: Nodemon auto-restarts ✅
```

## 📦 Package Scripts Reference

| Script | Command | Description |
|--------|---------|-------------|
| `start` | `node src/index.js` | Production start |
| `dev` | `nodemon` | Development with auto-reload |
| `dev:test` | `nodemon test-server.js` | Test server with auto-reload |
| `dev:inspect` | `nodemon --inspect src/index.js` | Debug mode |
| `test` | `jest --coverage` | Run tests |
| `test:watch` | `jest --watch` | Tests in watch mode |
| `lint` | `eslint src/**/*.js` | Check code quality |
| `lint:fix` | `eslint src/**/*.js --fix` | Fix linting issues |

## 🎨 Colored Output

Nodemon provides colored output:
- 🟢 **Green**: Starting/Restarting
- 🔵 **Blue**: Watching files
- 🔴 **Red**: Errors
- 🟡 **Yellow**: Warnings

## ⚡ Performance Tips

### Faster Restarts

1. **Ignore unnecessary files**:
   ```json
   "ignore": ["logs/*", "uploads/*", "*.test.js"]
   ```

2. **Reduce watch directories**:
   ```json
   "watch": ["src"]
   ```

3. **Increase delay for slow I/O**:
   ```json
   "delay": 2000
   ```

### Memory Optimization

If running multiple services:
```bash
# Limit Node.js memory
NODE_OPTIONS="--max-old-space-size=2048" npm run dev
```

## 🚨 Troubleshooting

### Server Won't Restart

**Problem**: Changes not detected

**Solutions**:
1. Check file is in watched directory
2. Verify file extension is watched
3. Manual restart: type `rs` and Enter

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::5000`

**Solutions**:
```bash
# Find process on port 5000
lsof -ti:5000

# Kill process
kill -9 $(lsof -ti:5000)

# Or use different port
PORT=5001 npm run dev
```

### Too Many Restarts

**Problem**: Server restarting continuously

**Solutions**:
1. Check for file-writing loops
2. Ignore generated files
3. Increase delay in `nodemon.json`

### Nodemon Not Found

**Problem**: `command not found: nodemon`

**Solution**:
```bash
# Reinstall dependencies
npm install

# Or install globally
npm install -g nodemon
```

## 📚 Additional Resources

- [Nodemon Documentation](https://nodemon.io/)
- [Node.js Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [VS Code Node.js Debugging](https://code.visualstudio.com/docs/nodejs/nodejs-debugging)

---

**Happy Developing! 🚀**

Changes are automatically detected and the server restarts instantly!

