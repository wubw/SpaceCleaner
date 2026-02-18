# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SpaceCleaner is a Node.js/Express file management tool for cleaning disk space and executing backup tasks. It identifies empty files, duplicate files, and node_modules directories, with backup functionality to sync folders between source and target directories.

## Commands

```bash
# Start server (default port 3001)
node server.js

# Run tests
npm test
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
```

## Architecture

### Backend Modules
- **server.js** - Express server entry point, defines all HTTP routes
- **cleanup.js** - Core cleanup logic: directory scanning, empty/duplicate detection, auto-deletion of macOS junk files (.DS_Store, ._*, .icloud)
- **backup.js** - Compares source/target directories and copies missing/modified files
- **utility.js** - Helper functions: MD5 checksum, file comparison, folder compression, recursive copy

### Frontend (public/)
- **main.html** - jQuery-based UI with source/target path inputs, checkboxes for cleanup options
- **main.js** - HTTP calls to backend, dynamic table rendering

### Key Routes
- `GET /overview` - Scans directories for empty/duplicate files
- `POST /cleanup` - Deletes selected files/folders
- `GET /cleanrubbish` - Finds node_modules directories
- `POST /cleanrubbish` - Deletes selected node_modules
- `GET /backup` - Compares source/target for sync
- `POST /compress` - Zips selected folders

### Testing
Tests use Jest with mock-fs to avoid actual filesystem operations. Test files in `__tests__/unit/` mirror the module structure.

## Important Behaviors

- Auto-deletes macOS files: `.DS_Store`, `._*` prefix files, `.icloud` files
- Duplicate detection uses MD5 checksum matching after size comparison
- File operations use synchronous methods (`*Sync`) - may block on large directories
- Backup skips `.epub/` directories and `Microsoft.url` files
