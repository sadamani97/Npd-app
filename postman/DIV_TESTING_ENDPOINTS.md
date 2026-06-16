# 🧪 NPD Hostel Management - Div Testing Endpoint Directory

This document provides a comprehensive list of all API endpoints included in the **Div Testing Collection** (`postman/div_testing.postman_collection.json`). 

---

## ⚙️ Collection Variables (Default Configuration)

The collection is configured with variables at the collection level, enabling seamless environment-independent testing:

*   **`base_url`**: `http://localhost:5001` (Default local backend port)
*   **`token`**: JWT Token (Auto-populated upon successful login via pre-request / test script hooks)

---

## 📂 Quick Start: Import & Run

1. Open **Postman**.
2. Click **Import** (or `Ctrl + O` / `Cmd + O`).
3. Select **Choose Files** and upload:
   `postman/div_testing.postman_collection.json`
4. Make sure your local server is running on port **`5001`** (defined in `backend/.env`).
5. Run the authentication requests first; success scripts will save the JWT token to `{{token}}` automatically.

---

## 🗺️ Complete Endpoint URL Directory

### 🔑 1. Authentication Endpoints

> [!NOTE]
> Successful login requests automatically extract the JWT token from the JSON response and update the `token` variable.

| Method | Endpoint Route | Full Local URL | Description | Request Body Structure |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | `http://localhost:5001/api/auth/register` | Register admin account (Legacy) | `JSON`: `name`, `email`, `password` |
| `POST` | `/api/auth/login` | `http://localhost:5001/api/auth/login` | Login admin/staff (Legacy) | `JSON`: `email`, `password` |
| `POST` | `/api/auth/super-admin/login` | `http://localhost:5001/api/auth/super-admin/login` | Login Super Admin | `JSON`: `email`, `password` |
| `POST` | `/api/auth/hostel-admin` | `http://localhost:5001/api/auth/hostel-admin` | Create new Hostel Admin *(requires Super Admin)* | `JSON`: `name`, `email`, `password`, `phone`, `hostel_id` |
| `POST` | `/api/auth/request-otp` | `http://localhost:5001/api/auth/request-otp` | Request OTP for mobile resident login | `JSON`: `phone_number` |
| `POST` | `/api/auth/verify-otp` | `http://localhost:5001/api/auth/verify-otp` | Verify OTP and login resident | `JSON`: `phone_number`, `otp` |
| `POST` | `/api/auth/logout` | `http://localhost:5001/api/auth/logout` | Logout and clear session | *None* |

---

### 📊 2. Dashboard Endpoints

| Method | Endpoint Route | Full Local URL | Description | Key Path Variables |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/stats` | `http://localhost:5001/api/dashboard/stats` | Get active resident count, vacancies, etc. | *None* |
| `GET` | `/api/dashboard/block/:blockNumber` | `http://localhost:5001/api/dashboard/block/1` | Get occupancy and vacant counts for a block | `blockNumber` (e.g., `1`, `2`) |
| `GET` | `/api/dashboard/rooms` | `http://localhost:5001/api/dashboard/rooms` | Get floor-wise occupancy summaries | *None* |
| `GET` | `/api/dashboard/rooms/:roomNumber` | `http://localhost:5001/api/dashboard/rooms/101` | Get occupancy details of a specific room | `roomNumber` (Path variable) |

---

### 👥 3. Residents (Users) Endpoints

> [!IMPORTANT]
> Operations creating or editing residents utilize `multipart/form-data` to support resident profile picture uploads (`photo` field).

| Method | Endpoint Route | Full Local URL | Description | Parameters & Body Format |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/users` | `http://localhost:5001/api/users` | Add new resident *(Admin only)* | `form-data`: `name`, `phone`, `email`, `password`, `block_number`, `room_number`, `room_type`, `ac_status`, `photo` (file), `rent_amount`, `electricity_meter_reading` |
| `GET` | `/api/users` | `http://localhost:5001/api/users` | Get all active residents *(Admin only)* | *None* |
| `GET` | `/api/users/vacated` | `http://localhost:5001/api/users/vacated` | Get vacated resident list *(Admin only)* | *None* |
| `GET` | `/api/users/:id` | `http://localhost:5001/api/users/1` | Get specific resident details | `id` (Path variable) |
| `PUT` | `/api/users/:id` | `http://localhost:5001/api/users/1` | Update resident details | `form-data`: Any fields to edit (e.g. `name`, `photo`, `occupation`) |
| `PUT` | `/api/users/vacate/:id` | `http://localhost:5001/api/users/vacate/1` | Mark resident as vacated *(Admin only)* | `id` (Path variable) |
| `DELETE` | `/api/users/:id` | `http://localhost:5001/api/users/1` | Hard delete resident *(Admin only)* | `id` (Path variable) |

---

### 🚪 4. Rooms Endpoints

| Method | Endpoint Route | Full Local URL | Description | Parameters & Body Format |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/rooms/blocks` | `http://localhost:5001/api/rooms/blocks` | Get list of all blocks with vacancy rates | *None* |
| `GET` | `/api/rooms/block/:blockNumber` | `http://localhost:5001/api/rooms/block/1` | Get all rooms in a block | `blockNumber` (Path variable) |
| `GET` | `/api/rooms/:blockNumber/:roomNumber` | `http://localhost:5001/api/rooms/1/101` | Get detailed occupancies of a specific room | `blockNumber`, `roomNumber` (Path variables) |
| `POST` | `/api/rooms` | `http://localhost:5001/api/rooms` | Create a new room *(Admin only)* | `JSON`: `block_number`, `floor_number`, `room_number`, `room_type`, `is_premium`, `ac_status`, `capacity`, `base_rent`, `electricity_meter_number` |
| `PUT` | `/api/rooms/:roomId` | `http://localhost:5001/api/rooms/1` | Update room configurations *(Admin only)* | `JSON` body + `roomId` (Path variable) |
| `DELETE` | `/api/rooms/:roomId` | `http://localhost:5001/api/rooms/1` | Remove a room *(Admin only)* | `roomId` (Path variable) |

---

### ⚡ 5. Electricity Meters Endpoints

| Method | Endpoint Route | Full Local URL | Description | Parameters & Body Format |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/electricity-meters` | `http://localhost:5001/api/electricity-meters` | Add a meter to a room *(Admin only)* | `JSON`: `meter_number`, `block_number`, `floor_number`, `room_number`, `rate_per_unit` |
| `GET` | `/api/electricity-meters/block/:blockNumber` | `http://localhost:5001/api/electricity-meters/block/1` | Get all meters in a block | `blockNumber` (Path variable) |
| `GET` | `/api/electricity-meters/:meterId` | `http://localhost:5001/api/electricity-meters/1` | Get specific meter details | `meterId` (Path variable) |
| `PUT` | `/api/electricity-meters/:meterId/reading` | `http://localhost:5001/api/electricity-meters/1/reading` | Add current reading and split bill dynamically | `JSON`: `current_reading`, `rate_per_unit`, `reading_date` |
| `DELETE` | `/api/electricity-meters/:meterId/reading` | `http://localhost:5001/api/electricity-meters/1/reading` | Reset reading metrics to zero *(Admin only)* | `meterId` (Path variable) |
| `POST` | `/api/electricity-meters/:meterId/reset` | `http://localhost:5001/api/electricity-meters/1/reset` | Clear all readings log *(Admin only)* | `meterId` (Path variable) |
| `DELETE` | `/api/electricity-meters/:meterId` | `http://localhost:5001/api/electricity-meters/1` | Delete meter completely *(Admin only)* | `meterId` (Path variable) |
| `GET` | `/api/electricity-meters/report/:blockNumber` | `http://localhost:5001/api/electricity-meters/report/1` | Get meter consumption report | `blockNumber` (Path variable) |

---

### 💳 6. Payments Endpoints

| Method | Endpoint Route | Full Local URL | Description | Parameters & Body Format |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/payments/status/current-month` | `http://localhost:5001/api/payments/status/current-month` | Get current month payment status of residents | *None* |
| `GET` | `/api/payments/overdue/list` | `http://localhost:5001/api/payments/overdue/list` | Fetch residents with overdue payments *(Admin only)* | *None* |
| `GET` | `/api/payments/summary/monthly` | `http://localhost:5001/api/payments/summary/monthly` | Get collections summary grouped by month | *None* |
| `GET` | `/api/payments/history/:userId` | `http://localhost:5001/api/payments/history/1` | Get billing history for a resident | `userId` (Path variable) |
| `POST` | `/api/payments` | `http://localhost:5001/api/payments` | Record a new payment *(Admin only)* | `JSON`: `user_id`, `amount`, `month`, `payment_method`, `receipt_number`, `notes` |
| `PUT` | `/api/payments/:paymentId` | `http://localhost:5001/api/payments/1` | Toggle payment status (PAID/PENDING) | `JSON`: `payment_status` |

---

### 🛠️ 7. Complaints Endpoints

| Method | Endpoint Route | Full Local URL | Description | Parameters & Body Format |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/complaints` | `http://localhost:5001/api/complaints` | File a new complaint ticket | `JSON`: `title`, `description`, `category` (e.g. `PLUMBING`, `WIFI`) |
| `GET` | `/api/complaints` | `http://localhost:5001/api/complaints` | Get tickets (Users: self, Admin: all) | *None* |
| `PUT` | `/api/complaints/:id/status` | `http://localhost:5001/api/complaints/1/status` | Update ticket status *(Admin only)* | `JSON`: `status` (`PENDING`/`IN_PROGRESS`/`RESOLVED`) |
| `DELETE` | `/api/complaints/:id` | `http://localhost:5001/api/complaints/1` | Remove a complaint ticket *(Admin only)* | `id` (Path variable) |

---

### 📢 8. Circulars (Notices) Endpoints

| Method | Endpoint Route | Full Local URL | Description | Parameters & Body Format |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/circulars` | `http://localhost:5001/api/circulars` | Broadcast circular notice *(Admin only)* | `JSON`: `title`, `message`, `sentVia` (`WHATSAPP`/`EMAIL`/`BOTH`) |
| `GET` | `/api/circulars` | `http://localhost:5001/api/circulars` | Fetch circular notifications list | *None* |
| `DELETE` | `/api/circulars/:id` | `http://localhost:5001/api/circulars/1` | Delete circular board notice *(Admin only)* | `id` (Path variable) |

---

### 🍲 9. Food Menu Endpoints

| Method | Endpoint Route | Full Local URL | Description | Parameters & Query Params |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/food-menus` | `http://localhost:5001/api/food-menus` | Add a food menu item *(Admin only)* | `JSON`: `menu_date`, `meal_type`, `item_name`, `description`, `is_veg`, `is_available` |
| `GET` | `/api/food-menus/date` | `http://localhost:5001/api/food-menus/date?date=2026-06-09` | Get food menu of a specific date | `?date=YYYY-MM-DD` (Query parameter) |
| `GET` | `/api/food-menus` | `http://localhost:5001/api/food-menus` | Get all food menu items *(Admin only)* | `?date=YYYY-MM-DD` (Optional Query) |
| `PUT` | `/api/food-menus/:id` | `http://localhost:5001/api/food-menus/1` | Update menu details *(Admin only)* | `JSON` body + `id` (Path variable) |
| `DELETE` | `/api/food-menus/:id` | `http://localhost:5001/api/food-menus/1` | Delete a food item *(Admin only)* | `id` (Path variable) |

---

### 🍽️ 10. Food Confirmations Endpoints

| Method | Endpoint Route | Full Local URL | Description | Parameters & Query Params |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/food-confirmations` | `http://localhost:5001/api/food-confirmations` | Confirm meal attendance | `JSON`: `confirmation_date`, `breakfast`, `lunch`, `dinner`, `notes` |
| `POST` | `/api/food-confirmations/cancel` | `http://localhost:5001/api/food-confirmations/cancel` | Cancel confirmations | `JSON`: `confirmation_date` |
| `GET` | `/api/food-confirmations/user/date` | `http://localhost:5001/api/food-confirmations/user/date?confirmation_date=2026-06-09` | Get your confirmation for a date | `?confirmation_date=YYYY-MM-DD` |
| `GET` | `/api/food-confirmations/user/history` | `http://localhost:5001/api/food-confirmations/user/history?limit=30` | Get your past confirmations | `?limit=Count` |
| `GET` | `/api/food-confirmations/admin/by-date` | `http://localhost:5001/api/food-confirmations/admin/by-date?confirmation_date=2026-06-09&meal_type=BREAKFAST` | Get confirmations by meal and date | `?confirmation_date=YYYY-MM-DD&meal_type=TYPE` |
| `GET` | `/api/food-confirmations/admin/list` | `http://localhost:5001/api/food-confirmations/admin/list?confirmation_date=2026-06-09&is_confirmed=true` | Get comprehensive details | `?confirmation_date=YYYY-MM-DD&is_confirmed=Boolean` |

---

### 👑 11. Super Admin Endpoints

> [!CAUTION]
> These endpoints are reserved strictly for system-wide platform admins and require Super Admin authentication tokens.

| Method | Endpoint Route | Full Local URL | Description | Parameters & Query Params |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/super-admin/dashboard/stats` | `http://localhost:5001/api/super-admin/dashboard/stats` | View aggregated system stats across hostels | *None* |
| `GET` | `/api/super-admin/hostels` | `http://localhost:5001/api/super-admin/hostels?page=1&limit=10` | Fetch list of all registered hostels | `?page=Number&limit=Number` |
| `POST` | `/api/super-admin/hostels` | `http://localhost:5001/api/super-admin/hostels` | Register a new hostel tenant | `JSON`: `hostel_name`, `owner_name`, `owner_phone`, `owner_email`, `address`, `city`, `state`, `subscription_plan` |
| `PUT` | `/api/super-admin/hostels/:hostelId/approve` | `http://localhost:5001/api/super-admin/hostels/1/approve` | Approve a pending hostel tenant | `hostelId` (Path variable) |
| `GET` | `/api/super-admin/hostels/:hostelId` | `http://localhost:5001/api/super-admin/hostels/1` | Get detailed stats and revenue metrics | `hostelId` (Path variable) |
| `GET` | `/api/super-admin/hostels/:hostelId/analytics` | `http://localhost:5001/api/super-admin/hostels/1/analytics` | Get complaint and payment statistics | `hostelId` (Path variable) |
| `GET` | `/api/super-admin/analytics/payments` | `http://localhost:5001/api/super-admin/analytics/payments` | System-wide payment collection charts | *None* |
| `GET` | `/api/super-admin/analytics/complaints` | `http://localhost:5001/api/super-admin/analytics/complaints` | System-wide complaint response charts | *None* |
| `GET` | `/api/super-admin/analytics/residents` | `http://localhost:5001/api/super-admin/analytics/residents` | System-wide resident metrics | *None* |

---

### 🩺 12. Health Check Endpoint

| Method | Endpoint Route | Full Local URL | Description | Response Structure |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | `http://localhost:5001/api/health` | Verify server status | `{ "success": true, "message": "Server is running" }` |
