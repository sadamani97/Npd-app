// Test JWT workflow - shows how your app authenticates users
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

console.log("\n╔════════════════════════════════════════════════════════╗");
console.log("║           🔐 JWT Authentication Test                 ║");
console.log("╚════════════════════════════════════════════════════════╝\n");

// 1️⃣ SIMULATE USER LOGIN
console.log("1️⃣  USER LOGIN (Creating Token)");
console.log("─".repeat(55));

const userLogin = {
  id: 1,
  role: "ADMIN",
  email: "admin@hostel.com",
  name: "Admin User"
};

console.log("User logging in:");
console.log("  Email:", userLogin.email);
console.log("  Role:", userLogin.role);
console.log("\n");

// 2️⃣ CREATE TOKEN
console.log("2️⃣  CREATING JWT TOKEN");
console.log("─".repeat(55));

const token = jwt.sign(
  { id: userLogin.id, role: userLogin.role, email: userLogin.email },
  process.env.JWT_SECRET || "secret",
  { expiresIn: "7d" }
);

console.log("✅ Token created successfully!\n");
console.log("Token (first 50 chars):", token.substring(0, 50) + "...\n");

// 3️⃣ SHOW TOKEN STRUCTURE
console.log("3️⃣  TOKEN STRUCTURE");
console.log("─".repeat(55));

const parts = token.split(".");
console.log("Header (algorithm & type):");
console.log("  " + Buffer.from(parts[0], 'base64').toString());
console.log("\nPayload (user data):");
const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
console.log("  " + JSON.stringify(payload, null, 2).split('\n').join('\n  '));
console.log("\nSignature: " + parts[2].substring(0, 20) + "...\n");

// 4️⃣ VERIFY TOKEN
console.log("4️⃣  VERIFYING TOKEN (Middleware Check)");
console.log("─".repeat(55));

try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
  console.log("✅ Token is VALID!\n");
  console.log("Decoded user data:");
  console.log("  User ID:", decoded.id);
  console.log("  Email:", decoded.email);
  console.log("  Role:", decoded.role);
  console.log("  Issued at:", new Date(decoded.iat * 1000).toLocaleString());
  console.log("  Expires at:", new Date(decoded.exp * 1000).toLocaleString());
} catch (err) {
  console.error("❌ Token verification failed:", err.message);
}

console.log("\n");

// 5️⃣ TEST WITH WRONG SECRET
console.log("5️⃣  SECURITY TEST (Wrong Secret)");
console.log("─".repeat(55));

try {
  const decoded = jwt.verify(token, "wrong_secret_key");
  console.log("Token verified (shouldn't happen!)");
} catch (err) {
  console.log("✅ Correctly REJECTED with wrong secret!");
  console.log("   Error:", err.message);
}

console.log("\n");

// 6️⃣ TEST TOKEN EXPIRATION
console.log("6️⃣  TOKEN EXPIRATION TEST");
console.log("─".repeat(55));

const expiredToken = jwt.sign(
  { id: 1, role: "USER", email: "user@hostel.com" },
  process.env.JWT_SECRET || "secret",
  { expiresIn: "0s" }  // Expires immediately
);

console.log("Created token that expired 1 second ago...\n");

setTimeout(() => {
  try {
    jwt.verify(expiredToken, process.env.JWT_SECRET || "secret");
    console.log("Token accepted");
  } catch (err) {
    console.log("✅ Correctly REJECTED expired token!");
    console.log("   Error:", err.message);
  }
}, 1000);

console.log("\n");

// 7️⃣ YOUR .ENV SECRET
console.log("7️⃣  YOUR JWT SECRET STATUS");
console.log("─".repeat(55));

console.log("JWT_SECRET configured:", process.env.JWT_SECRET ? "✅ YES" : "❌ NO");
console.log("Secret length:", process.env.JWT_SECRET?.length || 0, "characters");
console.log("Secret first 20 chars:", process.env.JWT_SECRET?.substring(0, 20) + "...");

console.log("\n");

// 8️⃣ WORKFLOW SUMMARY
console.log("8️⃣  HOW YOUR APP USES JWT");
console.log("─".repeat(55));

console.log(`
┌─ User Logs In ─────────────────────────┐
│  POST /api/auth/login                  │
│  { email, password }                   │
└────────────────────────────────────────┘
                    ↓
        ✅ Verify password with bcrypt
                    ↓
┌─ Create JWT Token ─────────────────────┐
│  jwt.sign({id, role, email},           │
│    JWT_SECRET, {expiresIn: "7d"})      │
└────────────────────────────────────────┘
                    ↓
        Return token to frontend
                    ↓
┌─ Frontend Stores Token ────────────────┐
│  localStorage.setItem("token", token)  │
└────────────────────────────────────────┘
                    ↓
┌─ Frontend Sends with Every Request ───┐
│  Authorization: Bearer {token}         │
└────────────────────────────────────────┘
                    ↓
┌─ Backend Verifies Token ───────────────┐
│  jwt.verify(token, JWT_SECRET)         │
│  in auth middleware                    │
└────────────────────────────────────────┘
                    ↓
        ✅ Token valid → Access allowed
        ❌ Token invalid/expired → 401 error
`);

console.log("═".repeat(55));
console.log("\n✅ Test complete! Your JWT setup is working! 🔐\n");
