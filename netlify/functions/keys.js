import { getStore } from "@netlify/blobs";

const ADMIN_PASSWORD = "732012";

const store = getStore({
    name: "zephyris-keys",
    consistency: "strong"
});

async function readKeys() {
    const data = await store.get("all", { type: "json" });
    return Array.isArray(data) ? data : [];
}

export default async (request) => {
    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
        return new Response(null, { status: 200, headers });
    }

    const url = new URL(request.url);
    const password = url.searchParams.get("password") || "";
    const action = url.searchParams.get("action") || "";

    if (action === "verify") {
        try {
            const body = await request.json();
            const keyInput = String(body.key || "").trim().toUpperCase();
            const keys = await readKeys();
            const found = keys.find(k => String(k.key || "").toUpperCase() === keyInput);
            if (!found) return new Response(JSON.stringify({ status: 0, msg: "Key không tồn tại" }), { status: 200, headers });
            if (found.active === false) return new Response(JSON.stringify({ status: 0, msg: "Key đã bị khóa" }), { status: 200, headers });
            if (found.expires > 0 && Date.now() > found.expires) return new Response(JSON.stringify({ status: 0, msg: "Key đã hết hạn" }), { status: 200, headers });
            return new Response(JSON.stringify({ status: 1, msg: "Hợp lệ", data: found }), { status: 200, headers });
        } catch (error) {
            return new Response(JSON.stringify({ status: 0, msg: "Lỗi: " + error.message }), { status: 200, headers });
        }
    }

    if (password !== ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ status: 0, msg: "Mật khẩu sai" }), { status: 200, headers });
    }

    if (request.method === "GET") {
        const keys = await readKeys();
        return new Response(JSON.stringify({ status: 1, keys }), { status: 200, headers });
    }

    if (request.method === "POST") {
        try {
            const body = await request.json();
            let keys = await readKeys();

            if (action === "add") {
                const soLuong = Math.max(1, parseInt(body.quantity, 10) || 1);
                const soNgayRaw = parseInt(body.duration, 10);
                const soNgay = isNaN(soNgayRaw) ? 7 : soNgayRaw;

                const newKeys = [];
                for (let i = 0; i < soLuong; i++) {
                    newKeys.push({
                        id: "key_" + Date.now() + "_" + i + "_" + Math.random().toString(36).substring(2, 9),
                        key: sinhKey(),
                        owner: body.device || "Chưa gán",
                        plan: "premium",
                        duration: soNgay,
                        expires: soNgay === 0 ? 0 : Date.now() + soNgay * 86400000,
                        active: true,
                        activated: false,
                        created: new Date().toISOString()
                    });
                }
                keys = [...newKeys, ...keys];

            } else if (action === "delete") {
                const targetId = String(body.id || "");
                if (!targetId) {
                    return new Response(JSON.stringify({ status: 0, msg: "Thiếu id" }), { status: 200, headers });
                }
                const before = keys.length;
                keys = keys.filter(k => String(k.id) !== targetId);
                if (keys.length === before) {
                    return new Response(JSON.stringify({ status: 0, msg: "Không tìm thấy Key" }), { status: 200, headers });
                }

            } else if (action === "toggle") {
                const targetId = String(body.id || "");
                if (!targetId) {
                    return new Response(JSON.stringify({ status: 0, msg: "Thiếu id" }), { status: 200, headers });
                }
                let found = false;
                keys = keys.map(k => {
                    if (String(k.id) === targetId) {
                        found = true;
                        return { ...k, active: k.active === false ? true : false };
                    }
                    return k;
                });
                if (!found) {
                    return new Response(JSON.stringify({ status: 0, msg: "Không tìm thấy Key" }), { status: 200, headers });
                }
            }

            await store.setJSON("all", keys);
            return new Response(JSON.stringify({ status: 1, msg: "Thành công", keys }), { status: 200, headers });
        } catch (error) {
            return new Response(JSON.stringify({ status: 0, msg: "Lỗi: " + error.message }), { status: 200, headers });
        }
    }

    return new Response(JSON.stringify({ status: 0, msg: "Phương thức không hợp lệ" }), { status: 200, headers });
};

function sinhKey() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const phan = n => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    return "ZPR-" + phan(4) + "-" + phan(4) + "-" + phan(4);
}