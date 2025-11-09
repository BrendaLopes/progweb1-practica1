const API = "http://localhost:4000/api";
const $ = (id) => document.getElementById(id);
const out = $("auth-out");
const list = $("list");

// ================== AUTH helpers ==================
const getToken = () => localStorage.getItem("token") || "";

function parseJWT(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}
function isAdmin() {
  const t = getToken();
  const p = parseJWT(t);
  return !!p && p.role === "admin";
}
function requireToken() {
  const t = getToken();
  if (!t) throw new Error("Login primero");
  return t;
}

// fetch con auth opcional
async function api(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) headers.Authorization = `Bearer ${requireToken()}`;
  const r = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  // 204 No Content
  if (r.status === 204) return null;
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = data?.error || `Error ${r.status}`;
    throw new Error(msg);
  }
  return data;
}

// ================ AUTH (registro / login) =================
$("btn-register").onclick = async () => {
  try {
    const body = {
      name: $("name").value,
      email: $("email").value,
      password: $("pass").value,
      role: $("role").value,
    };
    const data = await api("/auth/register", { method: "POST", body });
    if (data.token) localStorage.setItem("token", data.token);
    out.textContent = JSON.stringify(data, null, 2);
    updateStatusChip();
  } catch (e) {
    alert(e.message);
  }
};

$("btn-login").onclick = async () => {
  try {
    const body = { email: $("email").value, password: $("pass").value };
    const data = await api("/auth/login", { method: "POST", body });
    if (data.token) localStorage.setItem("token", data.token);
    out.textContent = JSON.stringify(data, null, 2);
    updateStatusChip();
  } catch (e) {
    alert(e.message);
  }
};

function updateStatusChip() {
  const chip = document.getElementById("status-chip");
  const on = !!getToken();
  chip.textContent = on ? "online" : "offline";
  chip.classList.toggle("ok", on);
}

// =================== PRODUCTOS ====================
async function loadProducts() {
  try {
    const items = await api("/products");
    renderProducts(items);
  } catch (e) {
    alert(e.message);
  }
}

function renderProducts(items) {
  const admin = isAdmin();
  list.innerHTML = items
    .map(
      (p) => `
<li>
  <div>
    <strong>${escapeHtml(p.name)}</strong> — ${Number(p.price).toFixed(2)}€
    ${p.desc ? `<div class="muted">${escapeHtml(p.desc)}</div>` : ""}
  </div>
  ${
    admin
      ? `<div class="actions">
           <button class="btn" data-edit="${p._id}">Editar</button>
           <button class="btn" data-del="${p._id}">Borrar</button>
         </div>`
      : ""
  }
</li>`
    )
    .join("");
}

// edición y borrado por delegación
list.addEventListener("click", async (e) => {
  const editId = e.target.getAttribute("data-edit");
  const delId = e.target.getAttribute("data-del");

  if (editId) {
    try {
      // Obtener el producto actual para precargar valores (opcional: ya lo tienes en DOM; aquí lo pedimos por claridad)
      const current = await api(`/products/${editId}`);
      const name = prompt("Nombre", current.name);
      if (name == null) return;
      const priceStr = prompt("Precio", String(current.price));
      if (priceStr == null) return;
      const price = Number(priceStr);
      if (Number.isNaN(price)) return alert("Precio inválido");
      const desc = prompt("Descripción", current.desc || "") ?? "";

      await api(`/products/${editId}`, {
        method: "PUT",
        auth: true,
        body: { name, price, desc },
      });
      await loadProducts();
      alert("Producto actualizado");
    } catch (err) {
      alert(err.message);
    }
    return;
  }

  if (delId) {
    try {
      const ok = confirm("¿Seguro que quieres borrar el producto?");
      if (!ok) return;
      await api(`/products/${delId}`, { method: "DELETE", auth: true });
      await loadProducts();
      alert("Producto eliminado");
    } catch (err) {
      alert(err.message);
    }
  }
});

// crear producto
$("btn-new").onclick = async () => {
  try {
    if (!isAdmin()) return alert("Debes ser admin para crear productos");
    const name = prompt("Nombre del producto");
    if (!name) return;
    const priceStr = prompt("Precio");
    const price = Number(priceStr);
    if (Number.isNaN(price)) return alert("Precio inválido");
    const desc = prompt("Descripción") || "";
    await api("/products", { method: "POST", auth: true, body: { name, price, desc } });
    await loadProducts();
    alert("Producto creado");
  } catch (e) {
    alert(e.message);
  }
};

// leer lista
$("btn-load").onclick = loadProducts;

// util mínimo para evitar inyección en HTML
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Estado del chip al cargar
updateStatusChip();
