# Hostel Food Management System - Quick Start Guide

## 🚀 GETTING STARTED

### Step 1: Backend Setup
```bash
cd backend
npm install
```

**Create `.env` file** in backend folder:
```env
PORT=5001
DB_HOST=localhost
DB_PORT=3306
DB_NAME=hostel_app
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key_here

# Twilio OTP Setup (Optional - Demo mode works without it)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+14155238886
```

**Start Backend:**
```bash
npm run dev
```
Backend runs on `http://localhost:5001`

---

### Step 2: Frontend Setup
```bash
cd frontend
npm install
```

**Start Frontend:**
```bash
npm start
```
Frontend runs on `http://localhost:3000`

---

## 📱 USER LOGIN FLOW

### For Regular Users (NEW - OTP Login)
1. Visit `http://localhost:3000/otp-login`
2. Enter 10-digit mobile number (e.g., 9876543210)
3. System sends OTP via:
   - 🟢 **WhatsApp** (preferred)
   - 📱 **SMS** (fallback)
   - 🔵 **Demo Mode** (shows in backend console)
4. Enter 6-digit OTP
5. Click "Verify & Login"
6. ✅ Successfully logged in!

### For Admin (Legacy - Email + Password)
1. Visit `http://localhost:3000/login`
2. Enter admin email and password
3. Click "Login"

---

## 🎯 DEMO TESTING (No Twilio Required)

In **demo mode**, follow these steps:

### Test OTP Flow
1. Go to OTP login page
2. Enter mobile: `9876543210`
3. Check **backend console** - you'll see:
   ```
   ⚠️ Twilio OTP not configured. OTP (Demo Mode): 123456
   ```
4. Enter OTP `123456` in frontend
5. ✅ Login succeeds!

---

## 👥 USER FEATURES

### 1. Dashboard (`/user-dashboard`)
- Welcome message with Block/Room info
- Quick access to all features
- Recent announcements
- Today's menu preview
- My complaints status

### 2. Food Menu (`/food-menu`)
- 📅 Select any date
- 🌅 Breakfast items
- ☀️ Lunch items  
- 🌙 Dinner items
- View descriptions & veg/non-veg tags
- Check availability

### 3. Food Confirmation (`/food-confirmation`)
- 📅 Select date
- ✅ Choose meals needed:
  - 🌅 Breakfast
  - ☀️ Lunch
  - 🌙 Dinner
- 📝 Add notes (dietary requirements)
- 💾 Save confirmation
- ❌ Cancel if needed

### 4. My Complaints (`/user-complaints`)
- View all complaints
- Track status:
  - 🔵 Pending
  - 🟡 In Progress
  - 🟢 Resolved
- Raise new complaints

### 5. Announcements (`/user-circulars`)
- View all hostel announcements
- Important notices
- Updates from admin

### 6. Profile (`/user-profile`)
- 👤 View personal info
- 🏠 View hostel details
- 📝 Edit emergency contacts
- 🚪 Logout

---

## 🛠️ ADMIN FEATURES

### 1. Admin Dashboard (`/dashboard`)
- 📊 Overview stats
- Residents count
- Occupancy info
- Recent activities

### 2. Add Resident (`/add-resident`)
- Enter name, phone, email
- Assign block & room
- Set room type (Single/Double/Triple share)
- AC/Non-AC preference
- Emergency contacts

### 3. Manage Rooms (`/manage-rooms`)
- View all rooms
- Check occupancy
- Assign residents
- Update room status

### 4. Food Confirmations (`/admin-food-confirmations`)
**NEW FEATURES:**
- 📅 Select date
- 📊 View statistics:
  - 🌅 Breakfast count
  - ☀️ Lunch count
  - 🌙 Dinner count
  - 👥 Total responses
- 🔍 Filter by meal type
- 📥 Export to CSV

**Table Columns:**
| Room | Name | Phone | Block | 🌅 | ☀️ | 🌙 | Date | Notes |

### 5. Complaint Management (`/complaints`)
- View all complaints
- Update status
- Add resolution notes

### 6. Circular Management (`/circulars`)
- Create announcements
- Send via WhatsApp/Email
- Track delivery status

---

## 🎨 Frontend Pages

### User Dashboard Pages
- **🏠 /user-dashboard** - Home page with overview cards
- **🍽️ /food-menu** - View daily food menu
- **✅ /food-confirmation** - Confirm/deny food for next day
- **📝 /user-complaints** - Create and track complaints
- **📢 /user-circulars** - View announcements

### Admin Dashboard Pages
- **📊 /dashboard** - Admin overview
- **📝 /admin-complaints** - Manage complaints
- **✅ /admin-food-confirmations** - Manage food confirmations
- **➕ /add-resident** - Add new resident
- **🛏️ /manage-rooms** - Manage hostel rooms
- **📢 /admin-circulars** - Manage announcements (existing)

---

## �️ DATABASE MODELS

### User Model
```javascript
{
  name, phone, email,
  block_number, room_number, room_type,
  is_phone_verified, // NEW
  password, // Optional
  role: 'ADMIN' | 'USER',
  status: 'ACTIVE' | 'VACATED'
}
```

### OTP Verification Model (NEW)
```javascript
{
  phone_number,
  otp,
  attempts, // Max 5
  is_verified,
  verified_at,
  expires_at // 10 minutes
}
```

### Food Confirmation Model (UPDATED)
```javascript
{
  user_id,
  confirmation_date,
  breakfast: true/false,     // NEW
  lunch: true/false,         // NEW
  dinner: true/false,        // NEW
  is_confirmed,              // UPDATED
  confirmed_at,
  notes
}
```

---

## 🔗 API ENDPOINTS

### Auth APIs
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/request-otp` | Send OTP |
| POST | `/api/auth/verify-otp` | Verify OTP & Login |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/login` | Admin Login |

### Food Menu APIs
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/food-menus/date?date=YYYY-MM-DD` | Get menu for date |
| POST | `/api/food-menus` | Add menu (Admin) |

### Food Confirmation APIs
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/food-confirmations` | Submit confirmation |
| POST | `/api/food-confirmations/cancel` | Cancel confirmation |
| GET | `/api/food-confirmations/user/date?confirmation_date=...` | Get user's confirmation |
| GET | `/api/food-confirmations/admin/by-date?confirmation_date=...` | Get all (Admin) with filters |

### User APIs
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/users/:id` | Get user profile |
| PUT | `/api/users/:id` | Update profile |

---

## 📸 SCREENSHOTS

### OTP Login
```
┌─────────────────────────────┐
│       🏠 Hostel App         │
│                             │
│  User Login via OTP         │
│                             │
│  Mobile Number:             │
│  [_____9876543210_____]     │
│                             │
│  [    Send OTP    ]         │
└─────────────────────────────┘
```

### Food Confirmation
```
┌─────────────────────────────┐
│  🍽️ Confirm Meals           │
│                             │
│  Date: [2026-05-18]         │
│                             │
│  Select Meals Needed:       │
│  [🌅] [☀️ ] [🌙]            │
│                             │
│  [✅ Confirm Meals]         │
│  [❌ Cancel]                │
└─────────────────────────────┘
```

### Admin Food List
```
┌─────────────────────────────────────┐
│  🍽️ Food Confirmation List          │
│                                     │
│  📊 Stats:                          │
│  🌅 Breakfast: 45  ☀️ Lunch: 42     │
│  🌙 Dinner: 38     👥 Total: 50    │
│                                     │
│  [All] [Confirmed] [Not Confirmed] │
│                                     │
│  Room | Name | Phone | 🌅 | ☀️ | 🌙 │
│  A101 | John | 98765 | ✓  | ✓  | - │
│  B202 | Jane | 98764 | ✓  | -  | ✓ │
└─────────────────────────────────────┘
```

---

## ✅ TESTING CHECKLIST

### Backend Tests
- [ ] Database connects successfully
- [ ] OTP generation works
- [ ] OTP sends via WhatsApp/SMS/Demo
- [ ] User login with OTP succeeds
- [ ] JWT token generated and stored
- [ ] Token expires after 7 days

### Frontend Tests
- [ ] OTP login page loads
- [ ] Mobile number validation works
- [ ] OTP entry accepts 6 digits only
- [ ] OTP timer shows countdown
- [ ] Login redirects to dashboard
- [ ] Sidebar shows no duplicate icons
- [ ] All menu items work

### Food Confirmation Tests
- [ ] Can select individual meals
- [ ] Can add notes
- [ ] Can update confirmation
- [ ] Can cancel confirmation
- [ ] Admin sees correct count
- [ ] CSV export works

### Responsive Tests
- [ ] Mobile (375px)
- [ ] Tablet (768px)
- [ ] Desktop (1024px+)
- [ ] Sidebar collapses on mobile

---

## 🐛 TROUBLESHOOTING

### OTP Not Sending
**Problem**: OTP shows in console but doesn't send to phone

**Solution**:
- This is normal (demo mode)
- Add Twilio credentials to `.env`
- Restart backend server

### Sidebar Icons Doubled
**Problem**: Icons appear twice in menu items

**Solution**:
- ✅ FIXED - Already resolved
- Icons should appear only once

### Food Confirmation Not Saving
**Problem**: Confirmation doesn't save

**Solution**:
- Check if user is logged in
- Ensure date is selected
- At least one meal must be selected
- Check browser console for errors

### Admin Can't See Confirmations
**Problem**: Admin food list is empty

**Solution**:
- Ensure users have submitted confirmations
- Check date is correct
- Verify user role is ADMIN

---

## 📞 SUPPORT

For issues or questions:
1. Check browser console (F12)
2. Check backend console for errors
3. Verify database is connected
4. Ensure all `.env` variables are set

---

## 🎓 NEXT STEPS

After successful implementation:
1. Deploy to production server
2. Set up automated backups
3. Configure email notifications
4. Add analytics dashboard
5. Implement push notifications
6. Set up monitoring & alerts

---

**Ready to Deploy! 🚀**
  -d '{"email":"admin@hostel.com","password":"admin123"}'
```

### Get Food Menu by Date (curl)
```bash
curl -X GET "http://localhost:5001/api/food-menus/date?date=2026-05-14" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Submit Food Confirmation (curl)
```bash
curl -X POST http://localhost:5001/api/food-confirmations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "confirmation_date":"2026-05-15",
    "is_confirmed":true,
    "notes":"I need food"
  }'
```

### Get Admin Food Confirmations (curl)
```bash
curl -X GET "http://localhost:5001/api/food-confirmations/admin/by-date?date=2026-05-15" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 📝 File Structure

### Frontend New Files
```
src/
├── pages/
│   ├── UserDashboard.jsx
│   ├── FoodConfirmation.jsx
│   ├── UserComplaints.jsx
│   ├── UserCirculars.jsx
│   ├── AdminComplaintManagement.jsx
│   └── AdminFoodConfirmationList.jsx
├── styles/
│   ├── UserDashboard.css
│   ├── FoodConfirmation.css
│   ├── UserComplaints.css
│   ├── UserCirculars.css
│   ├── AdminComplaintManagement.css
│   └── AdminFoodConfirmationList.css
└── components/
    └── Sidebar.jsx (Enhanced)
```

### Backend New Files
```
models/
├── foodMenu.model.js
└── foodConfirmation.model.js

Controllers/
├── foodMenu.controller.js
└── foodConfirmation.controller.js

routes/
├── foodMenu.routes.js
└── foodConfirmation.routes.js
```

---

## 🎯 Feature Checklist

### ✅ Implemented Features
- [x] Food Menu viewing by users
- [x] Food confirmation (Yes/No for next day)
- [x] User complaint creation
- [x] Admin complaint status updates
- [x] Admin food confirmation viewing
- [x] CSV export for confirmations
- [x] Role-based navigation
- [x] Mobile-responsive design
- [x] Back button navigation
- [x] Active link highlighting
- [x] Loading states and error handling
- [x] Form validation with character limits
- [x] Unique constraint on confirmations (prevent duplicates)

### ⏳ Optional Enhancements
- [ ] Email notifications
- [ ] SMS reminders
- [ ] Push notifications
- [ ] User profile editing
- [ ] Admin circular creation UI
- [ ] Analytics dashboard
- [ ] Auto-expiry of old confirmations
- [ ] User ratings/feedback
- [ ] Advanced search/filtering

---

## 🔐 Security Implemented

- [x] JWT token-based authentication
- [x] Role-based access control (ADMIN, USER)
- [x] Protected routes (require token)
- [x] Password hashing with bcryptjs
- [x] CORS configuration
- [x] Backend middleware validation
- [x] Error handling without exposing sensitive info

---

## 📞 Debugging Tips

### Check Backend Logs
- Terminal where `npm start` is running
- Look for database connection messages
- Check for route registration messages

### Check Frontend Logs
- Browser Developer Console (F12)
- Look for network requests
- Check Redux DevTools if installed
- React DevTools for component inspection

### Database Inspection
```bash
# Login to MySQL
mysql -u root -p

# Use database
USE hostel_db;

# Show tables
SHOW TABLES;

# Describe FoodMenu table
DESC FoodMenus;

# Query data
SELECT * FROM FoodMenus;
SELECT * FROM FoodConfirmations;
```

---

## 🚀 Deployment Step-by-Step

### Backend Deployment
1. Set environment variables in .env
2. Ensure database is accessible
3. Run `npm install` to install dependencies
4. Run `npm start` or use PM2 for production

### Frontend Deployment
1. Build: `npm run build`
2. Deploy `build/` folder to hosting service
3. Configure API_URL for production backend
4. Set up CORS on backend for production domain

---

## 📚 Additional Resources

- **Sequelize Docs:** https://sequelize.org/
- **React Docs:** https://react.dev/
- **Express Docs:** https://expressjs.com/
- **MySQL Docs:** https://dev.mysql.com/doc/

---

**Last Updated:** May 14, 2026
**Status:** Production Ready
**Maintainer:** Development Team

