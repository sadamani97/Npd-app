# Npd Hostel Management - Mobile Application 📱

React Native cross-platform mobile app for the Npd Hostel Management system built using Expo.

---

## Folder Structure Overview

```text
mobile/
├── App.js                     # Main application entry component
├── app.json                   # Expo project configuration
├── babel.config.js            # Babel configuration
├── index.js                   # Root entry point
├── package.json               # Dependencies & scripts
└── src/
    ├── api/
    │   └── axiosConfig.js     # Axios API client configured for backend (http://localhost:5001/api)
    ├── context/
    │   └── AuthContext.js     # Global Authentication State & JWT token management
    ├── navigation/
    │   ├── AppNavigator.js    # Primary dynamic router (Auth vs User vs Admin)
    │   ├── AuthNavigator.js   # Stack navigation for Login & Signup
    │   ├── UserTabNavigator.js# Bottom tab navigation for Resident View
    │   └── AdminTabNavigator.js# Bottom tab navigation for Admin View
    ├── screens/
    │   ├── auth/
    │   │   ├── LoginScreen.js
    │   │   └── SignupScreen.js
    │   ├── user/
    │   │   ├── UserDashboardScreen.js
    │   │   ├── FoodMenuScreen.js
    │   │   ├── ComplaintsScreen.js
    │   │   └── ProfileScreen.js
    │   └── admin/
    │       └── AdminDashboardScreen.js
    ├── styles/
    │   └── theme.js           # Design system tokens (colors, spacing, shadows)
    └── utils/
        └── storage.js         # AsyncStorage token & user persistence helper
```

---

## How to Run & Test

1. **Open your terminal** and navigate to the mobile app folder:
   ```bash
   cd mobile
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the Expo Development Server**:
   ```bash
   npm start
   ```
   *(or `npx expo start`)*

4. **Testing on a Physical Mobile Phone**:
   - Download the **Expo Go** app from the **Google Play Store** or **Apple App Store**.
   - Scan the QR code displayed in your terminal using Expo Go (or iOS Camera).
   - *Note*: Ensure your phone and computer are connected to the same Wi-Fi network, and update `API_BASE_URL` in [src/api/axiosConfig.js](file:///c:/Users/sadamani/OneDrive/Desktop/Npd/mobile/src/api/axiosConfig.js) to your computer's local IP (e.g. `http://192.168.x.x:5001/api`).
