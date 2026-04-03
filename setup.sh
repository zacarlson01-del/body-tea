#!/bin/bash

# ISEA Development Environment Setup Script
# Automates backend and frontend setup for local development

set -e

echo "=========================================="
echo "ISEA Authentication System - Setup Script"
echo "=========================================="
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL 12+"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js ${NODE_VERSION}"
echo "✅ npm $(npm -v)"
echo "✅ PostgreSQL detected"
echo ""

# Backend Setup
echo "========== Setting up Backend =========="
echo ""

if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    echo "✅ Backend dependencies installed"
else
    echo "✅ Backend dependencies already installed"
fi

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo ""
    echo "⚠️  Backend .env file not found"
    echo "Creating from template..."
    cp backend/.env.example backend/.env
    echo ""
    echo "⚠️  Please edit backend/.env with your configuration:"
    echo "   - Database credentials"
    echo "   - JWT secrets"
    echo "   - AWS S3 credentials (optional)"
    echo ""
fi

# Frontend Setup
echo ""
echo "========== Setting up Frontend =========="
echo ""

if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    echo "✅ Frontend dependencies installed"
else
    echo "✅ Frontend dependencies already installed"
fi

# Check if .env exists
if [ ! -f "frontend/.env" ]; then
    echo ""
    echo "ℹ️  Creating frontend .env file..."
    echo "REACT_APP_API_URL=http://localhost:5000/api" > frontend/.env
    echo "✅ Frontend .env created"
else
    echo "✅ Frontend .env already exists"
fi

# Database Setup
echo ""
echo "========== Setting up Database =========="
echo ""

read -p "Do you want to create the PostgreSQL database? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter PostgreSQL username (default: postgres): " DB_USER
    DB_USER=${DB_USER:-postgres}
    
    echo "Creating database 'isea_db'..."
    
    PGPASSWORD=$DB_USER psql -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = 'isea_db'" | grep -q 1 || \
        PGPASSWORD=$DB_USER psql -U $DB_USER -c "CREATE DATABASE isea_db;"
    
    echo "Running migrations..."
    psql -U $DB_USER -d isea_db -f backend/src/db/schema.sql
    
    echo "✅ Database setup complete"
else
    echo "⚠️  Skipping database creation"
    echo "To create manually, run:"
    echo "  createdb isea_db"
    echo "  psql -U postgres -d isea_db -f backend/src/db/schema.sql"
fi

# Summary
echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "📝 Next steps:"
echo "1. Edit backend/.env with your configuration:"
echo "   - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD"
echo "   - JWT_SECRET (generate a long random string)"
echo "   - AWS S3 credentials (if using S3)"
echo ""
echo "2. Start the backend:"
echo "   cd backend && npm run dev"
echo ""
echo "3. In another terminal, start the frontend:"
echo "   cd frontend && npm start"
echo ""
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo "📖 Documentation: see DOCUMENTATION.md"
echo "🚀 Deployment: see DEPLOYMENT.md"
echo ""
