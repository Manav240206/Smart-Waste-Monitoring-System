# ♻️ Smart Waste Monitoring System

A real-time, IoT-enabled waste tracking and management platform designed for Urban Local Bodies (ULBs). The system collects sensor readings from ESP32-powered smart bins (detecting **Wet**, **Dry**, and **Metal** waste) and streams live updates to an interactive React dashboard via **Socket.IO WebSockets**.

---

## ✨ Features

- 🛰️ **IoT Sensor Integration (ESP32)**: Automatically detects waste presence via IR sensors, measures moisture level, and identifies metallic content.
- ⚡ **Real-Time Live Updates**: Uses **Socket.IO WebSockets** to broadcast new waste entries instantly to connected dashboard clients without polling overhead.
- 📊 **Interactive Analytics**: Visualizes waste distribution (Wet, Dry, Metal) using Chart.js doughnut charts and locality-wise breakdowns.
- 🔐 **Authentication & Security**: JWT-based login and user registration system.
- 🎨 **Modern Responsive UI**: Built with React 19, Tailwind CSS, Lucide Icons, and Glassmorphism design elements.

---

## 🏗️ System Architecture

```
┌─────────────────────────┐         HTTP POST        ┌────────────────────────────────┐
│   ESP32 Smart Bin       │  ─────────────────────>  │   Node.js / Express Backend    │
│ (IR + Moisture + Metal) │                          │  (Port 5001 + MongoDB + JWT)   │
└─────────────────────────┘                          └───────────────┬────────────────┘
                                                                     │
                                                           Socket.io │ Real-time
                                                           WebSockets│ Events
                                                                     ▼
                                                     ┌────────────────────────────────┐
                                                     │    React + Vite Dashboard      │
                                                     │   (Live Chart.js Analytics)    │
                                                     └────────────────────────────────┘
```

---

## 📁 Repository Structure

```
Smart Waste Monitoring System/
├── backend/                  # Node.js & Express API Server
│   ├── config/               # Database configuration (MongoDB Mongoose)
│   ├── middleware/           # Authentication middleware (JWT)
│   ├── models/               # MongoDB models (User, WasteRecord)
│   ├── routes/               # API endpoints (/api/auth, /api/waste)
│   ├── index.js              # Server entry point + Socket.IO setup
│   └── .env.example          # Environment variable template
├── frontend/                 # React 19 + Vite Dashboard App
│   ├── src/
│   │   ├── components/       # Reusable components (PrivateRoute)
│   │   ├── context/          # React Context (AuthContext)
│   │   ├── pages/            # App pages (Dashboard, Login, Register)
│   │   └── App.jsx           # Main App router
│   └── .env.example          # Frontend environment configuration
└── esp32_smart_bin/          # ESP32 Arduino C++ Firmware
    └── esp32_smart_bin.ino   # Microcontroller code for sensor reading & HTTP POST
```

---

## 🚀 Getting Started

### 1. Prerequisites

Ensure you have the following installed on your environment:
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) (Running locally or MongoDB Atlas)
- [Arduino IDE](https://www.arduino.cc/en/software) (with ESP32 board support installed)

---

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment configuration
cp .env.example .env

# Start backend server
npm start
```
By default, the backend server runs on `http://localhost:5001`.

---

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment configuration
cp .env.example .env

# Start Vite dev server
npm run dev
```
Open `http://localhost:5173` in your browser to access the dashboard.

---

### 4. ESP32 Firmware Setup

1. Open `esp32_smart_bin/esp32_smart_bin.ino` in Arduino IDE.
2. Update the Wi-Fi credentials and backend server endpoint:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   const char* serverUrl = "http://<YOUR_BACKEND_IP>:5001/api/waste";
   ```
3. Connect your ESP32 board via USB, select the correct COM port, and upload the sketch.

---

## 📡 API Endpoints Summary

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a new user |
| `POST` | `/api/auth/login` | Public | Authenticate user & get JWT token |
| `GET` | `/api/waste` | Private | Fetch all waste records (supports `?wasteType=Wet\|Dry\|Metal`) |
| `GET` | `/api/waste/analytics` | Private | Fetch waste distribution counts |
| `POST` | `/api/waste` | Public | Add new waste record (emits Socket.IO event) |

---

## 🤝 License

This project is licensed under the ISC License.
