# Inventory Tracker

A full-stack inventory management system with a React frontend and Django REST API backend.

## Quick Start

### On macOS/Linux:
```bash
chmod +x scripts/start-unix.sh
./scripts/start-unix.sh
```

### On Windows:
```bash
scripts\start-windows.bat
```

### Or from any terminal:
```bash
cd inventory-tracker
npm run dev
```

---

## Prerequisites

- **Node.js** v14+ ([Download](https://nodejs.org/))
- **Python** 3.8+ ([Download](https://www.python.org/))
- **Git** ([Download](https://git-scm.com/))

**Verify installation:**
```bash
node --version
python --version
npm --version
```

---

## Project Structure

```
Inventory-System/
  inventory-tracker/          # Main application
    public/                    # Static files
    src/
       Backend/               # Django REST API
          Config/            # Django settings
          Database/          # Models & views
          manage.py
       Frontend/              # React components
          HomePage/
          InventoryPage/
          RecipePage/
          SalesPage/
          loginPage/
          images/
       api.js                 # API client
       index.js               # React entry
       index.css
    package.json

  scripts/                    # Startup scripts
    start-unix.sh              # macOS/Linux startup
    start-windows.bat          # Windows startup
    start-backend.js           # Node.js backend launcher

  docs/                       # Documentation
    SETUP_GUIDE.md
    DEPLOYMENT.md

  .venv/                      # Python virtual environment (auto-created)

 .env                           # Environment variables
 .gitignore
 README.md                      # This file
 package-lock.json
```

---

## Manual Setup

If the automatic scripts don't work:

### 1. Create Virtual Environment

**macOS/Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

**Windows:**
```bash
python -m venv .venv
.venv\Scripts\activate.bat
```

### 2. Install Dependencies

```bash
# Python backend
pip install django djangorestframework django-cors-headers python-dotenv

# Frontend
cd inventory-tracker
npm install
```

### 3. Run Migrations

```bash
cd inventory-tracker/src/Backend
python manage.py migrate
```

### 4. Start Application

From `inventory-tracker/` directory:

```bash
npm run dev
```

---

## Access Points

Once running:

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | React app |
| Backend API | http://localhost:8000 | Django API |
| Admin Panel | http://localhost:8000/admin | Django admin |

---

## Available Commands

```bash
# Start both frontend and backend
npm run dev

# Start only backend
npm run start:backend

# Start only frontend
npm run start:frontend

# Build for production
npm run build

# Run tests
npm run test
```

---

## Troubleshooting

### Port Already in Use

**macOS/Linux:**
```bash
lsof -ti:3000 | xargs kill -9    # Kill port 3000
lsof -ti:8000 | xargs kill -9    # Kill port 8000
```

**Windows:**
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F

netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Python Not Found

Make sure Python is in your PATH:

**macOS/Linux:**
```bash
which python3
```

**Windows:**
```bash
where python
```

If not found, reinstall Python and select "Add Python to PATH" during installation.

### Virtual Environment Issues

**macOS/Linux:**
```bash
deactivate
rm -rf .venv
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

**Windows:**
```bash
deactivate
rmdir /s .venv
python -m venv .venv
.venv\Scripts\activate.bat
pip install -r requirements.txt
```

---

## Environment Variables

Create a `.env` file in the root directory:

```env
DEBUG=True
DJANGO_SECRET_KEY=your-secret-key-here
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
DATABASE_URL=sqlite:///db.sqlite3
```

---

## Documentation

- [Setup Guide](./docs/SETUP_GUIDE.md) - Detailed setup instructions
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment
- [Cross-Platform Info](./docs/CROSS_PLATFORM_INFO.md) - OS compatibility

---

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -m "Add feature"`
3. Push to branch: `git push origin feature/your-feature`
4. Open a pull request

---

## License

This project is private. All rights reserved.

---

## Tips

- **Hot Reload:** Both frontend and backend support auto-reload on file changes
- **API Testing:** Use http://localhost:8000/admin or Postman to test endpoints
- **Console Logs:** Check browser console (F12) for frontend errors and terminal for backend errors

---

## Support

For issues or questions, check the [docs](./docs/) folder or review error messages in the console.

**Happy coding!**
