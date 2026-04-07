const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Cross-platform backend startup script
 * Automatically handles virtual environment setup for Windows, macOS, and Linux
 */

const isWindows = process.platform === 'win32';
const projectRoot = path.join(__dirname, '..');
const venvDir = path.join(projectRoot, '.venv');
const backendDir = path.join(projectRoot, 'inventory-tracker', 'src', 'Backend');

// Determine Python executable paths based on OS
let pythonExe = 'python';
let pipExe = 'pip';

if (isWindows) {
  pythonExe = path.join(venvDir, 'Scripts', 'python.exe');
  pipExe = path.join(venvDir, 'Scripts', 'pip.exe');
} else {
  pythonExe = path.join(venvDir, 'bin', 'python');
  pipExe = path.join(venvDir, 'bin', 'pip');
}

// Start the application initialization
initializeAndStart();

function initializeAndStart() {
  // Create virtual environment if it doesn't exist
  if (!fs.existsSync(venvDir)) {
    console.log('Creating virtual environment...');
    createVirtualEnvironment();
  } else {
    installDependencies();
  }
}

function createVirtualEnvironment() {
  const venvCmd = isWindows ? 'python' : 'python3';
  
  const createVenv = spawn(venvCmd, ['-m', 'venv', venvDir], {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: isWindows
  });

  createVenv.on('close', (code) => {
    if (code === 0) {
      console.log('Virtual environment created\n');
      installDependencies();
    } else {
      console.error('Failed to create virtual environment');
      process.exit(1);
    }
  });
}

function installDependencies() {
  console.log('Installing Python dependencies...');
  
  const dependencies = [
    'django',
    'djangorestframework',
    'django-cors-headers',
    'python-dotenv'
  ];

  const pipInstall = spawn(pipExe, ['install', '-q', ...dependencies], {
    stdio: 'inherit',
    shell: isWindows
  });

  pipInstall.on('close', (code) => {
    console.log('Dependencies installed\n');
    runMigrations();
  });
}

function runMigrations() {
  console.log('Running database migrations...');
  
  const migrate = spawn(pythonExe, ['manage.py', 'migrate', '--noinput'], {
    cwd: backendDir,
    stdio: 'pipe',
    shell: isWindows
  });

  migrate.on('close', (code) => {
    console.log('Migrations complete\n');
    startServer();
  });
}

function startServer() {
  console.log('==================================================');
  console.log('Starting Django development server');
  console.log('==================================================');
  console.log('Backend:  http://127.0.0.1:8000');
  console.log('Frontend: http://localhost:3000');
  console.log('');

  const server = spawn(pythonExe, ['manage.py', 'runserver', '8000'], {
    cwd: backendDir,
    stdio: 'inherit',
    shell: isWindows
  });

  // Handle termination gracefully
  process.on('SIGINT', () => {
    console.log('\n\nShutting down...');
    server.kill('SIGTERM');
    process.exit(0);
  });

  server.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`Backend process exited with code ${code}`);
    }
  });
}
