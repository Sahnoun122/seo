#!/usr/bin/env bash

# Premium Auto-Installer for AI SEO Article Generator
# Designed for CodeCanyon and Github Distribution

# Style variables
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

clear

# Banner
echo -e "${CYAN}${BOLD}"
echo "=========================================================="
echo "      ___   ___   ___ _____ ___      ___ ___  ___ "
echo "     / _ \ / __| | __|_   _/ _ \    / __/ __|/ _ \\"
echo "    / ___ \\\\__ \ | _|  | || (_) |  | (__\\\\__ \ (_) |"
echo "   /_/   \_\\___/ |___| |_| \___/    \___|___/\___/ "
echo "                                                          "
echo "         A U T O M A T I C   I N S T A L L E R           "
echo "=========================================================="
echo -e "${NC}"

echo -e "${BLUE}[*] Starting system diagnostics...${NC}"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR] Node.js is not installed.${NC}"
    echo -e "${YELLOW}Please install Node.js (v18 or higher recommended) and try again.${NC}"
    exit 1
else
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}[OK] Node.js is installed: ${BOLD}${NODE_VERSION}${NC}"
fi

# Check for npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}[ERROR] npm is not installed.${NC}"
    echo -e "${YELLOW}Please install npm (usually comes with Node.js) and try again.${NC}"
    exit 1
else
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}[OK] npm is installed: ${BOLD}${NPM_VERSION}${NC}"
fi

echo -e "\n${BLUE}[*] Setting up configuration environment files...${NC}"

# Set up Backend .env
if [ -f "backend/.env" ]; then
    echo -e "${YELLOW}[!] backend/.env already exists. Skipping copy.${NC}"
else
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo -e "${GREEN}[OK] Created backend/.env from template.${NC}"
    else
        echo -e "${RED}[WARNING] backend/.env.example not found. Cannot auto-create .env.${NC}"
    fi
fi

# Set up Frontend .env
if [ -f "frontend/.env" ]; then
    echo -e "${YELLOW}[!] frontend/.env already exists. Skipping copy.${NC}"
else
    if [ -f "frontend/.env.example" ]; then
        cp frontend/.env.example frontend/.env
        echo -e "${GREEN}[OK] Created frontend/.env from template.${NC}"
    else
        echo -e "${RED}[WARNING] frontend/.env.example not found. Cannot auto-create .env.${NC}"
    fi
fi

echo -e "\n${BLUE}[*] Installing application dependencies (this may take a minute)...${NC}"

# Install root dependencies
echo -e "${CYAN}> Installing Root dependencies...${NC}"
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}[OK] Root dependencies installed successfully.${NC}"
else
    echo -e "${RED}[ERROR] Root dependency installation failed.${NC}"
    exit 1
fi

# Install backend dependencies
echo -e "\n${CYAN}> Installing Backend dependencies...${NC}"
npm install --prefix backend
if [ $? -eq 0 ]; then
    echo -e "${GREEN}[OK] Backend dependencies installed successfully.${NC}"
else
    echo -e "${RED}[ERROR] Backend dependency installation failed.${NC}"
    exit 1
fi

# Install frontend dependencies
echo -e "\n${CYAN}> Installing Frontend dependencies...${NC}"
npm install --prefix frontend
if [ $? -eq 0 ]; then
    echo -e "${GREEN}[OK] Frontend dependencies installed successfully.${NC}"
else
    echo -e "${RED}[ERROR] Frontend dependency installation failed.${NC}"
    exit 1
fi

echo -e "\n${GREEN}${BOLD}==========================================================${NC}"
echo -e "${GREEN}${BOLD}🎉 SUCCESS: AI SEO Article Generator is ready to go!      ${NC}"
echo -e "${GREEN}${BOLD}==========================================================${NC}\n"

echo -e "${BOLD}Setup Checklist:${NC}"
echo -e " 1. Configure ${CYAN}backend/.env${NC} with your ${BOLD}OpenAI API Key${NC} & ${BOLD}MongoDB URI${NC}."
echo -e " 2. Configure ${CYAN}frontend/.env${NC} with your backend API URL (default is http://localhost:5000/api)."
echo -e " 3. Read the premium interactive guide at: ${MAGENTA}documentation/index.html${NC}"
echo -e "\n${BOLD}To start the complete application in Development Mode:${NC}"
echo -e "   ${CYAN}npm run dev${NC}"
echo -e "\n${BOLD}To start the complete application in Production Mode:${NC}"
echo -e "   ${CYAN}npm run start${NC}"
echo ""
