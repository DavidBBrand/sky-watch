# 🌙 Sky Watch

A high-precision, observatory-style dashboard featuring real-time astronomical tracking and local weather synchronization.

## 🚀 Getting Started

To run this application locally, you will need **two terminal windows** open (one for the backend and one for the frontend).

You must have Node.js and Python 3.8+ installed

## Frontend Setup (React + Vite)
Open your first bash terminal:

cd skyapp-frontend
npm install
npm run dev

## BACKEND SETUP
## open your second terminal

cd backend
python -m venv venv


## activate virtual environment on Windows:

.\venv\Scripts\activate

## On Mac/Linux:
source venv/bin/activate

## Install libraries and dependencies

pip install -r requirements.txt

## Launch Uvicorn ASGI server

uvicorn main:app --reload
