import jwt from "jsonwebtoken";

const getJwtSecret = () => {
  return process.env.JWT_SECRET || "supersecret_npd_jwt_key_2026_hostel_mgmt_token";
};

export const signToken = (payload, expiresIn = "7d") => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (err) {
    return null;
  }
};
