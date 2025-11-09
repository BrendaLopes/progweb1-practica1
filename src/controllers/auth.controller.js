import jwt from "jsonwebtoken";
import User from "../models/User.js";

const sign = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || "2d" }
  );

export async function register(req, res) {
  try {
    const { name, email, password, role = "user" } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "Email ya registrado" });

    const user = await User.create({ name, email, password, role });
    return res.status(201).json({
      token: sign(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (e) {
    return res.status(400).json({ error: "Datos inválidos" });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

  const ok = await user.comparePassword(password);
  if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });

  return res.json({
    token: sign(user),
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
}
