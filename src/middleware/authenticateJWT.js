import jwt from "jsonwebtoken";

export function authenticateJWT(requiredRole) {
  return (req, res, next) => {
    try {
      const token = (req.headers.authorization || "").replace("Bearer ", "");
      if (!token) return res.status(401).json({ error: "No token" });
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (requiredRole && payload.role !== requiredRole) {
        return res.status(403).json({ error: "Forbidden" });
      }
      req.user = payload; // { id, email, role }
      next();
    } catch {
      res.status(401).json({ error: "Invalid token" });
    }
  };
}
