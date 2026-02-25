# 🛣️ Road Quality & Pothole Mapper

A modern, high-performance dashboard for visualizing road quality data, specifically focusing on pothole and bumper detection. The application uses a "Liquid Glass" design language for a premium, futuristic aesthetic.

## ✨ Features

- **Live Pothole Mapping**: Visualizes road anomalies using interactive heatmaps and precise marker layers.
- **Severity Classification**: Automatically categorizes detections into Minor, Moderate, Severe, and Critical based on accelerometer (Shock) and gyroscope (Rocking) data.
- **Smart Navigation**: Integrated routing with support for multiple alternatives, featuring a Google Maps-inspired UX for starting points and destinations.
- **Detailed Analytics**: Collapsible stats panel providing real-time metrics on total detections and peak values.
- **Interactive Popups**: Click on any detection to view precise coordinates, timestamps, and a visual severity gauge.

## 🛠️ Tech Stack

- **Frontend**: React + Vite
- **Styling**: Tailwind CSS + Vanilla CSS (Liquid Glass System)
- **Mapping**: MapLibre GL with Dark Matter base style
- **Routing**: OpenRouteService (ORS) Directions API
- **Backend/Database**: Firebase Realtime Database
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- An [OpenRouteService API Key](https://openrouteservice.org/dev/#/signup) (Free)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/arjun-mec/pothole-mapper.git
   cd pothole-mapper
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the root directory:
   ```env
   VITE_ORS_API_KEY=your_ors_api_key_here
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://your_project.firebasedatabase.app
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## 📸 Design Language: Liquid Glass
The project uses a custom design system characterized by:
- Deep glassmorphism (linear-gradients + extensive backdrop-filter blur)
- Subtle micro-animations and transitions
- Vibrant, curated color palettes for data visualization (Indigo, Violet, Emerald, and Amber)
