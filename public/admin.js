const API = "/api/keys";
let matKhau = "";

function layDanhSach() {
    return fetch(`${API}?password=${matKhau}`).then(r => r.json());
}

function thaoTac(action, duLieu) {
    return fetch(`${API}?password=${matKhau}&action=${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duLieu || {})
    }).then(r => r.json());
}

function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2000);
}

function hienThiKeys(keys) {
    const list = document.getElementById("keyList");
    list.innerHTML = "";
    const active = keys.filter(k => k.active).length;

    document.getElementById("totalKeys").textContent = keys.length;
    document.getElementById("activeKeys").textContent = active;
    document.getElementById("unusedKeys").textContent = keys.length - active;
    document.getElementById("listCount").textContent = keys.length + " Key";

    if (keys.length === 0) {
        list.innerHTML = "<div class='empty'><p>Chưa có Key nào</p></div>";
        return;
    }

    keys.forEach(k => {
        const row = document.createElement("div");
        row.className = "key-item";
        row.innerHTML = `
            <div class="key-main">
                <div class="key-code">${k.key}</div>
                <div class="key-device">Ghi chú: ${k.owner || "Chưa gán"}</div>
            </div>
            <div class="key-info">
                <div class="info-title">THỜI HẠN</div>
                <div class="info-value">${k.duration === 0 ? "Vĩnh viễn" : k.duration + " ngày"}</div>
            </div>
            <div class="key-info">
                <div class="info-title">TRẠNG THÁI</div>
                <span class="status ${k.active ? 'active' : 'unused'}">${k.active ? 'Hoạt động' : 'Đã khóa'}</span>
            </div>
            <div class="actions">
                <button class="action" data-copy="${k.key}">Copy</button>
                <button class="action delete" data-id="${k.id}">Xóa</button>
            </div>`;
        list.appendChild(row);
    });

    list.querySelectorAll("[data-copy]").forEach(b => b.onclick = () => {
        navigator.clipboard.writeText(b.dataset.copy);
        toast("Đã copy Key");
    });
    list.querySelectorAll("[data-id]").forEach(b => b.onclick = async () => {
        if (!confirm("Xóa Key này?")) return;
        await thaoTac("delete", { id: b.dataset.id });
        taiLai();
    });
}

async function taiLai() {
    const data = await layDanhSach();
    if (data.status === 1) hienThiKeys(data.keys);
}

document.getElementById("loginBtn").onclick = async () => {
    matKhau = document.getElementById("password").value;
    const data = await layDanhSach();
    if (data.status === 1) {
        document.getElementById("loginScreen").style.display = "none";
        document.getElementById("app").style.display = "block";
        hienThiKeys(data.keys);
    } else {
        document.getElementById("loginError").style.display = "block";
    }
};

document.getElementById("logoutBtn").onclick = () => location.reload();

document.getElementById("createBtn").onclick = async () => {
    await thaoTac("add", {
        duration: document.getElementById("duration").value,
        device: document.getElementById("device").value,
        quantity: document.getElementById("quantity").value
    });
    toast("Đã tạo Key");
    taiLai();
};