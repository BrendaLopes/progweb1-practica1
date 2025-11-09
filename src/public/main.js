const API = "http://localhost:4000/api";
const $ = (id) => document.getElementById(id);
const out = $("auth-out");
const list = $("list");

// ================== AUTH helpers ==================
const getToken = () => localStorage.getItem("token") || "";
const hasToken = () => !!getToken();

function parseJWT(token) {
  try { return JSON.parse(atob(token.split(".")[1])); } catch { return null; }
}
function isLoggedIn() {
  const t = getToken();
  if (!t) return false;
  const p = parseJWT(t);
  if (p?.exp && Date.now() >= p.exp * 1000) {
    localStorage.removeItem("token");
    return false;
  }
  return !!p;
}
function isAdmin() {
  const p = parseJWT(getToken());
  return !!p && p.role === "admin";
}
function requireToken() {
  const t = getToken();
  if (!t) throw new Error("Login primero");
  const p = parseJWT(t);
  if (p?.exp && Date.now() >= p.exp * 1000) {
    localStorage.removeItem("token");
    throw new Error("Sesión expirada. Inicia sesión otra vez.");
  }
  return t;
}

// ================== fetch helper ==================
async function api(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) headers.Authorization = `Bearer ${requireToken()}`;
  const r = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (r.status === 204) return null;
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error || `Error ${r.status}`);
  return data;
}

// ================== AUTH (registro / login / logout) ==================
$("btn-register").onclick = async () => {
  try {
    const body = {
      name: $("name").value.trim(),
      email: $("email").value.trim(),
      password: $("pass").value,
      role: $("role").value,
    };
    const data = await api("/auth/register", { method: "POST", body });
    if (data.token) localStorage.setItem("token", data.token);
    out.textContent = JSON.stringify(data, null, 2);
    updateStatusChip();
  } catch (e) { alert(e.message); }
};

$("btn-login").onclick = async () => {
  try {
    const body = { email: $("email").value.trim(), password: $("pass").value };
    const data = await api("/auth/login", { method: "POST", body });
    if (data.token) localStorage.setItem("token", data.token);
    out.textContent = JSON.stringify(data, null, 2);
    updateStatusChip();
  } catch (e) { alert(e.message); }
};

// opcional: botón de logout si lo añades en el HTML con id="btn-logout"
const btnLogout = document.getElementById("btn-logout");
if (btnLogout) {
  btnLogout.onclick = () => {
    localStorage.removeItem("token");
    list.innerHTML = "";
    out.textContent = "";
    updateStatusChip();
  };
}

function updateStatusChip() {
  const chip = document.getElementById("status-chip");
  const on = isLoggedIn();
  chip.textContent = on ? "online" : "offline";
  chip.classList.toggle("ok", on);
  // desactiva acciones si no hay token
  $("btn-load").disabled = !on;
  $("btn-new").disabled = !on;
}

// =================== PRODUCTOS (todo PRIVADO) ====================
async function loadProducts() {
  try {
    const items = await api("/products", { auth: true }); // requiere token
    renderProducts(items);
  } catch (e) { alert(e.message); }
}

function renderProducts(items) {
  const admin = isAdmin();
  list.innerHTML = items.map((p) => `
<li>
  <div>
    <strong>${escapeHtml(p.name)}</strong> — ${Number(p.price).toFixed(2)}€
    ${p.desc ? `<div class="muted">${escapeHtml(p.desc)}</div>` : ""}
  </div>
  ${admin ? `
    <div class="actions">
      <button class="btn" data-edit="${p._id}">Editar</button>
      <button class="btn" data-del="${p._id}">Borrar</button>
    </div>` : ``}
</li>`).join("");
}

// Delegación de eventos para editar / borrar
list.addEventListener("click", async (e) => {
  const editId = e.target.getAttribute("data-edit");
  const delId = e.target.getAttribute("data-del");

  if (editId) {
    if (!isAdmin()) return alert("Debes ser admin para editar");
    try {
      const current = await api(`/products/${editId}`, { auth: true });
      const name = prompt("Nombre", current.name); if (name == null) return;
      const priceStr = prompt("Precio", String(current.price)); if (priceStr == null) return;
      const price = Number(priceStr); if (Number.isNaN(price)) return alert("Precio inválido");
      const desc = prompt("Descripción", current.desc || "") ?? "";

      await api(`/products/${editId}`, { method: "PUT", auth: true, body: { name, price, desc } });
      await loadProducts();
      alert("Producto actualizado");
    } catch (err) { alert(err.message); }
    return;
  }

  if (delId) {
    if (!isAdmin()) return alert("Debes ser admin para borrar");
    try {
      const ok = confirm("¿Seguro que quieres borrar el producto?"); if (!ok) return;
      await api(`/products/${delId}`, { method: "DELETE", auth: true });
      await loadProducts();
      alert("Producto eliminado");
    } catch (err) { alert(err.message); }
  }
});

// crear producto
$("btn-new").onclick = async () => {
  if (!isAdmin()) return alert("Debes ser admin para crear productos");
  try {
    const name = prompt("Nombre del producto"); if (!name) return;
    const priceStr = prompt("Precio"); const price = Number(priceStr);
    if (Number.isNaN(price)) return alert("Precio inválido");
    const desc = prompt("Descripción") || "";
    await api("/products", { method: "POST", auth: true, body: { name, price, desc } });
    await loadProducts();
    alert("Producto creado");
  } catch (e) { alert(e.message); }
};

// bind del botón cargar
$("btn-load").onclick = () => {
  if (!hasToken()) return alert("Inicia sesión para ver productos");
  loadProducts();
};

// proteger enlace al chat desde el index
const chatLink = document.querySelector('a[href="chat.html"]');
if (chatLink) {
  chatLink.addEventListener("click", (e) => {
    if (!hasToken()) { e.preventDefault(); alert("Debes iniciar sesión para entrar al chat"); }
  });
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

// init
updateStatusChip();
