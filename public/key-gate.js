(function(){
    const API = "/api/keys";
    const LS = { DEVICE: "vsh_license_device", KEY: "vsh_license_key" };

    let deviceId = localStorage.getItem(LS.DEVICE);
    if (!deviceId) {
        deviceId = crypto.randomUUID().toUpperCase();
        localStorage.setItem(LS.DEVICE, deviceId);
    }

    async function kiemTraKey(key) {
        const r = await fetch(`${API}?password=public`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "verify", key })
        });
        return r.json();
    }

    function hienThiCong() {
        // Logic hiển thị cổng nhập key
        console.log("Cần nhập key");
    }

    async function guard() {
        const saved = localStorage.getItem(LS.KEY);
        if (!saved) return hienThiCong();
        const kq = await kiemTraKey(saved);
        if (kq.status !== 1) {
            localStorage.removeItem(LS.KEY);
            hienThiCong();
            return;
        }
        document.getElementById("appContent").style.display = "block";
    }

    window.VSHKeyGate = { guard };
    guard();
})();