# 🚀 NPD Hostel Management API Postman Testing Guide

This guide provides instructions on how to test the NPD Hostel Management API using **Postman**. We have generated a comprehensive Postman collection containing all endpoints, default payloads, variables, and automated authentication scripts.

---

## 📂 Quick Start: Importing the Collection

1. Open **Postman**.
2. Click the **Import** button in the top left or press `Ctrl + O` (`Cmd + O` on macOS).
3. Select **Choose Files** and upload the generated collection file:
   📁 [Npd_Hostel_Management_API.postman_collection.json](file:///c:/Users/sadamani/OneDrive/Desktop/Npd/Npd_Hostel_Management_API.postman_collection.json)
4. Click **Import** to load it into your workspace.

---

## ⚙️ Collection Variables & Environments

The collection has built-in variables configured at the **Collection Level** so you do not need to repeat them in individual requests:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `base_url` | `http://localhost:3000` | The backend base URL (update this if running on a different port or host). |
| `token` | `PASTE_YOUR_JWT_TOKEN_HERE` | Stores your active JWT token. Automatically updated on successful logins. |

### 🔐 Automatic Authentication
The endpoints that require login are configured to inherit **Bearer Token** authorization from the parent collection. 
> [!TIP]
> **No manual token copy-paste needed!** The collection includes **Test Scripts** on all login endpoints (Admin, Super Admin, and OTP Verification). When you execute a login request successfully, the script will automatically parse the response and save the JWT token to the collection variable `token` for subsequent requests.

---

## 🗺️ API Route Map & Details

### 🔑 1. Authentication
*All public/login routes. Success saves JWT token automatically.*

| Method | Endpoint | Description | Request Body Format | Key Parameters / Fields |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new admin account (Legacy) | `raw JSON` | `name`, `email`, `password` |
| `POST` | `/api/auth/login` | Login for admin/staff (Legacy) | `raw JSON` | `email` (or phone), `password` |
| `POST` | `/api/auth/super-admin/login` | Login for Super Admin | `raw JSON` | `email`, `password` |
| `POST` | `/api/auth/hostel-admin` | Create new Hostel Admin *(requires Super Admin)* | `raw JSON` | `name`, `email`, `password`, `phone`, `hostel_id` |
| `POST` | `/api/auth/request-otp` | Request OTP for mobile resident login | `raw JSON` | `phone_number` |
| `POST` | `/api/auth/verify-otp` | Verify OTP and login resident | `raw JSON` | `phone_number`, `otp` |
| `POST` | `/api/auth/logout` | Invalidate current session | `No Body` | None |

---

### 📊 2. Dashboard
*Endpoints for analytics and block statistics.*

| Method | Endpoint | Description | Path/Query Variables |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/stats` | Get active resident count, vacancy rates, etc. | None |
| `GET` | `/api/dashboard/block/:blockNumber` | Get occupancy and vacant counts for a block | `blockNumber` (e.g., `1`, `2`) |
| `GET` | `/api/dashboard/rooms` | Get floor-wise room occupancy counts | None |
| `GET` | `/api/dashboard/rooms/:roomNumber` | Get occupancy details of a specific room | `roomNumber` (e.g. `101`) |

---

### 👥 3. Residents (Users)
*Management of hostel residents. Supports file upload for profile pictures.*

> [!NOTE]
> Endpoints that add or update residents use `form-data` encoding to support uploading profile pictures using Multer.

| Method | Endpoint | Description | Request Body Format | Key Fields |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/users` | Add a new resident *(Admin only)* | `form-data` | `name`, `phone`, `email`, `password`, `block_number`, `room_number`, `room_type`, `ac_status`, `photo` (file), `rent_amount`, `electricity_meter_reading` |
| `GET` | `/api/users` | Get all active residents *(Admin only)* | `No Body` | Filtered by tenant isolation (hostel) |
| `GET` | `/api/users/vacated` | Get vacated resident list *(Admin only)* | `No Body` | None |
| `GET` | `/api/users/:id` | Get specific resident details | `No Body` | `id` (Resident ID) |
| `PUT` | `/api/users/:id` | Update resident details | `form-data` | Any updateable fields (e.g. `name`, `occupation`, `photo`) |
| `PUT` | `/api/users/vacate/:id` | Move resident to vacated list *(Admin only)* | `No Body` | `id` (Resident ID) |
| `DELETE` | `/api/users/:id` | Hard delete resident from database *(Admin only)* | `No Body` | `id` (Resident ID) |

---

### 🚪 4. Rooms
*For maintaining hostel rooms, bases rents, and sharing capacity.*

| Method | Endpoint | Description | Request Body | Path/Query Variables |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/rooms/blocks` | Get list of all blocks with summary statistics | `No Body` | None |
| `GET` | `/api/rooms/block/:blockNumber` | Get all rooms in a specific block | `No Body` | `blockNumber` |
| `GET` | `/api/rooms/:blockNumber/:roomNumber` | Get detailed occupancy of a specific room | `No Body` | `blockNumber`, `roomNumber` |
| `POST` | `/api/rooms` | Create a new room *(Admin only)* | `raw JSON` | `block_number`, `floor_number`, `room_number`, `room_type`, `is_premium`, `ac_status`, `capacity`, `base_rent`, `electricity_meter_number` |
| `PUT` | `/api/rooms/:roomId` | Update room configuration *(Admin only)* | `raw JSON` | `roomId` |
| `DELETE` | `/api/rooms/:roomId` | Remove room from list *(Admin only)* | `No Body` | `roomId` |

---

### ⚡ 5. Electricity Meters
*Supports recording current readings and automatically splitting charges daily among roommates.*

| Method | Endpoint | Description | Request Body | Path/Query Variables |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/electricity-meters` | Add a meter to a room *(Admin only)* | `raw JSON` | `meter_number`, `block_number`, `floor_number`, `room_number`, `rate_per_unit` |
| `GET` | `/api/electricity-meters/block/:blockNumber` | Get all meters for a block | `No Body` | `blockNumber` |
| `GET` | `/api/electricity-meters/:meterId` | Get details of a meter | `No Body` | `meterId` |
| `PUT` | `/api/electricity-meters/:meterId/reading` | Record a reading and split bills *(Admin only)* | `raw JSON` | `current_reading`, `rate_per_unit`, `reading_date` |
| `DELETE` | `/api/electricity-meters/:meterId/reading` | Reset reading details to zero *(Admin only)* | `No Body` | `meterId` |
| `POST` | `/api/electricity-meters/:meterId/reset` | Fully clear meter readings *(Admin only)* | `No Body` | `meterId` |
| `DELETE` | `/api/electricity-meters/:meterId` | Hard delete meter *(Admin only)* | `No Body` | `meterId` |
| `GET` | `/api/electricity-meters/report/:blockNumber` | Generate consumption and charge summaries | `No Body` | `blockNumber` |

---

### 💳 6. Payments
*Tracks rent and electricity billing statuses and payments.*

| Method | Endpoint | Description | Request Body | Path/Query Variables |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/payments/status/current-month` | See current month payment state of all residents | `No Body` | None |
| `GET` | `/api/payments/overdue/list` | See unpaid bills past due date *(Admin only)* | `No Body` | None |
| `GET` | `/api/payments/summary/monthly` | Get total collected vs pending amount by month | `No Body` | None |
| `GET` | `/api/payments/history/:userId` | Get payment logs for a resident | `No Body` | `userId` |
| `POST` | `/api/payments` | Record a new payment *(Admin only)* | `raw JSON` | `user_id`, `amount`, `month`, `payment_method`, `receipt_number`, `notes` |
| `PUT` | `/api/payments/:paymentId` | Update status (PAID/PENDING) *(Admin only)* | `raw JSON` | `payment_status` |

---

### 🛠️ 7. Complaints
*System for filing maintenance and support tickets.*

| Method | Endpoint | Description | Request Body | Path/Query Variables |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/complaints` | File a new complaint ticket | `raw JSON` | `title`, `description`, `category` |
| `GET` | `/api/complaints` | Get tickets (Users see own, admins see all) | `No Body` | None |
| `PUT` | `/api/complaints/:id/status` | Update ticket status *(Admin only)* | `raw JSON` | `status` (PENDING / IN_PROGRESS / RESOLVED) |
| `DELETE` | `/api/complaints/:id` | Remove ticket *(Admin only)* | `No Body` | `id` |

---

### 📢 8. Circulars
*Broadcasting notices to residents.*

| Method | Endpoint | Description | Request Body | Path/Query Variables |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/circulars` | Broadcast circular notice *(Admin only)* | `raw JSON` | `title`, `message`, `sentVia` (WHATSAPP/EMAIL/BOTH) |
| `GET` | `/api/circulars` | Fetch circular list | `No Body` | None |
| `DELETE` | `/api/circulars/:id` | Delete circular *(Admin only)* | `No Body` | `id` |

---

### 🍲 9. Food Menu
*Admin management of food menus.*

| Method | Endpoint | Description | Request Body | Query Parameters |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/food-menus` | Add a food menu *(Admin only)* | `raw JSON` | `menu_date`, `meal_type` (e.g. BREAKFAST), `item_name`, `description`, `is_veg`, `is_available` |
| `GET` | `/api/food-menus/date` | Get food menu for a day | `No Body` | `?date=YYYY-MM-DD` |
| `GET` | `/api/food-menus` | Get all food menus *(Admin only)* | `No Body` | `?date=YYYY-MM-DD` (optional) |
| `PUT` | `/api/food-menus/:id` | Update food menu *(Admin only)* | `raw JSON` | `id` |
| `DELETE` | `/api/food-menus/:id` | Delete menu item *(Admin only)* | `No Body` | `id` |

---

### 🍽️ 10. Food Confirmations
*Let residents choose which meals they will eat so kitchen staff can reduce waste.*

| Method | Endpoint | Description | Request Body | Query Parameters |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/food-confirmations` | Confirm meals for a day | `raw JSON` | `confirmation_date`, `breakfast`, `lunch`, `dinner`, `notes` |
| `POST` | `/api/food-confirmations/cancel` | Cancel confirmations | `raw JSON` | `confirmation_date` |
| `GET` | `/api/food-confirmations/user/date` | Get your confirmation for a date | `No Body` | `?confirmation_date=YYYY-MM-DD` |
| `GET` | `/api/food-confirmations/user/history` | Get your past confirmations | `No Body` | `?limit=30` |
| `GET` | `/api/food-confirmations/admin/by-date` | Get confirmations by date *(Admin only)* | `No Body` | `?confirmation_date=YYYY-MM-DD&meal_type=BREAKFAST` |
| `GET` | `/api/food-confirmations/admin/list` | Get comprehensive list *(Admin only)* | `No Body` | `?confirmation_date=YYYY-MM-DD&is_confirmed=true` |

---

### 👑 11. Super Admin
*Multi-tenant and hostel control endpoints (requires Super Admin login).*

| Method | Endpoint | Description | Request Body | Path/Query Variables |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/super-admin/dashboard/stats` | View aggregated system stats | `No Body` | None |
| `GET` | `/api/super-admin/hostels` | Fetch list of all registered hostels | `No Body` | `?page=1&limit=10` |
| `POST` | `/api/super-admin/hostels` | Register a new hostel tenant | `raw JSON` | `hostel_name`, `owner_name`, `owner_email`, etc. |
| `PUT` | `/api/super-admin/hostels/:hostelId/approve` | Approve a pending hostel tenant | `No Body` | `hostelId` |
| `GET` | `/api/super-admin/hostels/:hostelId` | Get details and revenue of a hostel | `No Body` | `hostelId` |
| `GET` | `/api/super-admin/hostels/:hostelId/analytics` | Get complaints and payments for a hostel | `No Body` | `hostelId` |
| `GET` | `/api/super-admin/analytics/payments` | Get system-wide payment statistics | `No Body` | None |
| `GET` | `/api/super-admin/analytics/complaints` | Get system-wide complaints metrics | `No Body` | None |
| `GET` | `/api/super-admin/analytics/residents` | Get system-wide resident stats | `No Body` | None |

---

## 🩺 12. Health Check
*Simple diagnostic check to verify server is active.*
- **Method:** `GET`
- **Endpoint:** `/api/health`
- **Headers:** None required
- **Response Format:** `{ "success": true, "message": "Server is running" }`

---

> [!IMPORTANT]
> If your backend is running locally, ensure it is turned on (`npm run dev` or `node server.js`) and matches the `base_url` variable in Postman. All API queries are configured to use JSON payload structures where applicable (except uploads, which use standard `multipart/form-data`). If you face any CORS errors, verify that `localhost` or your current host is permitted under `allowedOrigins` in `app.js`.
