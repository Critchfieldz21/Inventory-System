#  Cross-Platform Compatibility

Complete information about running Inventory Tracker on Windows, macOS, and Linux.

## Platform Support

| Platform | Support | Notes |
|----------|---------|-------|
| macOS (Intel) | Full | Tested on macOS 10.15+ |
| macOS (Apple Silicon) | Full | M1/M2/M3 compatible |
| Windows 10/11 | Full | PowerShell, CMD, Git Bash compatible |
| Ubuntu/Debian | Full | Python 3.8+ required |
| Other Linux | Full | GLIBC 2.17+ required |

---

## How Cross-Platform Support Works

### Technology Stack

- **Node.js:** Cross-platform JavaScript runtime
- **Python:** Cross-platform with platform-specific venv activation
- **React:** Web framework (works on all browsers)
- **Django:** Cross-platform Python web framework

### Startup Process

```

  User runs: npm run dev                     
  (works on Windows, macOS, Linux)           

  Node.js detects OS                         

  Windows?              Non-Windows?         
   Use .venv\Scripts\  Use .venv/bin/   
   python.exe          python            
   pip.exe             pip               

  Install dependencies (same on all OS)      

  Run migrations (same on all OS)            

  Start servers (same on all OS)             

```

---

## Starting the Application

### macOS / Linux

**Option 1: Shell Script**
```bash
chmod +x scripts/start-unix.sh
./scripts/start-unix.sh
```

**Option 2: npm command**
```bash
cd inventory-tracker
npm run dev
```

**Option 3: Manual**
```bash
source .venv/bin/activate
cd inventory-tracker
npm run dev
```

### Windows

**Option 1: Batch Script**
```bash
scripts\start-windows.bat
```

**Option 2: npm command**
```bash
cd inventory-tracker
npm run dev
```

**Option 3: Manual (PowerShell)**
```bash
.\.venv\Scripts\Activate.ps1
cd inventory-tracker
npm run dev
```

**Option 3: Manual (Command Prompt)**
```bash
.venv\Scripts\activate.bat
cd inventory-tracker
npm run dev
```

---

## Key Differences Between Platforms

### Virtual Environment Activation

**macOS/Linux:**
```bash
source .venv/bin/activate
```

**Windows (PowerShell):**
```bash
.\.venv\Scripts\Activate.ps1
```

**Windows (Command Prompt):**
```bash
.venv\Scripts\activate.bat
```

### Python Executable Location

**macOS/Linux:**
```
.venv/bin/python
.venv/bin/pip
```

**Windows:**
```
.venv\Scripts\python.exe
.venv\Scripts\pip.exe
```

### File Paths

**macOS/Linux:**
```
./scripts/start-unix.sh
src/Backend/manage.py
```

**Windows:**
```
.\scripts\start-windows.bat
src\Backend\manage.py
```

### Terminal Commands

| Command | macOS/Linux | Windows |
|---------|------------|---------|
| List files | `ls -la` | `dir` |
| Kill process | `kill -9 PID` | `taskkill /PID PID /F` |
| Find on port | `lsof -i :3000` | `netstat -ano | findstr :3000` |
| Path separator | `/` | `\` |
| Comment | `#` | `REM` |

---

## Installation Requirements by OS

### macOS

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install node python3 git

# Verify
node --version
python3 --version
```

### Windows

1. Download and install:
   - [Node.js](https://nodejs.org/) - Choose LTS version
   - [Python](https://www.python.org/) - **Check "Add Python to PATH"**
   - [Git](https://git-scm.com/)

2. Restart your computer

3. Verify in Command Prompt:
```bash
node --version
python --version
npm --version
```

### Ubuntu/Debian

```bash
# Update package manager
sudo apt update

# Install dependencies
sudo apt install -y nodejs npm python3 python3-venv git

# Verify
node --version
python3 --version
```

### Fedora/RHEL

```bash
# Install dependencies
sudo dnf install -y nodejs npm python3 git

# Verify
node --version
python3 --version
```

---

## Troubleshooting by OS

### macOS Issues

**Problem:** "python3: command not found"
```bash
# Install via Homebrew
brew install python3

# Or use full path
/usr/local/bin/python3
```

**Problem:** Permission denied on scripts
```bash
chmod +x scripts/start-unix.sh
./scripts/start-unix.sh
```

**Problem:** Port still in use
```bash
lsof -i :3000
kill -9 <PID>
```

### Windows Issues

**Problem:** "python is not recognized"
- Reinstall Python with "Add Python to PATH" checked
- Restart Command Prompt after installation

**Problem:** Scripts won't run
- Use PowerShell instead of Command Prompt
- Or use: `npm run dev` instead of batch file

**Problem:** Permission denied errors
```bash
# Run as Administrator
Right-click Command Prompt → Run as Administrator
```

### Linux Issues

**Problem:** "python3: command not found"
```bash
sudo apt install python3 python3-venv  # Ubuntu/Debian
sudo dnf install python3                # Fedora
```

**Problem:** Permission denied
```bash
chmod +x scripts/start-unix.sh
```

**Problem:** "No module named 'venv'"
```bash
sudo apt install python3-venv
```

---

## Environment Variables by OS

### macOS/Linux

Set temporarily:
```bash
export DJANGO_SECRET_KEY="your-key-here"
export DEBUG=True
```

Set permanently in `~/.zshrc` or `~/.bashrc`:
```bash
export DJANGO_SECRET_KEY="your-key-here"
```

### Windows (Command Prompt)

Set temporarily:
```bash
set DJANGO_SECRET_KEY=your-key-here
set DEBUG=True
```

Set permanently:
1. Press `Win+X` → System
2. Advanced system settings
3. Environment Variables
4. Add new variables

### Windows (PowerShell)

Set temporarily:
```bash
$env:DJANGO_SECRET_KEY="your-key-here"
$env:DEBUG="True"
```

---

## Testing Cross-Platform

### Verify Setup Works

```bash
# All platforms
npm --version
node --version
python --version

# Should output versions without errors
```

### Test Backend

```bash
cd inventory-tracker/src/Backend
python manage.py check
```

Expected output:
```
System check identified no issues (0 silenced).
```

### Test Frontend

```bash
cd inventory-tracker
npm list react
```

Expected output:
```
inventory-tracker@0.1.0 
 react@19.2.4
```

---

## Compatibility Matrix

### Node.js Versions

| Version | Status | Notes |
|---------|--------|-------|
| 14.x | Supported | LTS |
| 16.x | Supported | LTS |
| 18.x | Supported | LTS (Recommended) |
| 20.x | Supported | LTS |

### Python Versions

| Version | Status | Notes |
|---------|--------|-------|
| 3.8 | Supported | Minimum |
| 3.9 | Supported | |
| 3.10 | Supported | |
| 3.11 | Supported | Recommended |
| 3.12 | Supported | Latest |

### Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | Full | Latest 2 versions |
| Firefox | Full | Latest 2 versions |
| Safari | Full | Latest 2 versions |
| Edge | Full | Latest 2 versions |
| IE 11 | Not supported | Use React polyfills for IE |

---

## Next Steps

- [Setup Guide](./SETUP_GUIDE.md) - Detailed setup
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment
- [Main README](../README.md) - Project overview

---

## Summary

 Fully cross-platform (Windows, macOS, Linux)  
 Single `npm run dev` command for all OS  
 Automatic environment detection  
 Same codebase, no modifications needed  

**The application will work identically on all supported platforms!** 
