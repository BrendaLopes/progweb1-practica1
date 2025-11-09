import Product from "../models/Product.js";

export async function list(_req, res) {
  const items = await Product.find().sort({ createdAt: -1 });
  res.json(items);
}

export async function getOne(req, res) {
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ error: "No encontrado" });
  res.json(p);
}

export async function create(req, res) {
  const { name, price, desc = "" } = req.body;
  if (!name || price == null) return res.status(400).json({ error: "Faltan campos" });
  const p = await Product.create({ name, price, desc, createdBy: req.user.id });
  res.status(201).json(p);
}

export async function update(req, res) {
  const { name, price, desc } = req.body;
  const p = await Product.findByIdAndUpdate(
    req.params.id,
    { name, price, desc },
    { new: true, runValidators: true }
  );
  if (!p) return res.status(404).json({ error: "No encontrado" });
  res.json(p);
}

export async function remove(req, res) {
  const p = await Product.findByIdAndDelete(req.params.id);
  if (!p) return res.status(404).json({ error: "No encontrado" });
  res.status(204).send();
}
