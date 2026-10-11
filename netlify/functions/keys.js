import { getStore } from "@netlify/blobs";

const ADMIN_PASSWORD = "732012";

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

    const store = getStore("zephyris-keys");
    let keys = (await store.get("all", { type: "json" })) || [];

    // ============ ACTION: verify (KHÔNG CẦN PASSWORD) ============
    if (action === "verify") {
        try {
            const body = await request.json();
            const found = keys.find(k => k.key === body.key);
            if (!found) {
                return new Response(JSON.stringify({ status: 0, msg: "Key không tồn tại" }), { status: 200, headers });
            }
            if (!found.active) {
                return new Response(JSON.stringify({ status: 0, msg: "Key đã bị khóa" }), { status: 200, headers });
            }
            if (found.expires > 0 && Date.now() > found.expires) {
                return new Response(JSON.stringify({ status: 0, msg: "Key đã hết hạn" }), { status: 200, headers });
            }
            return new Response(JSON.stringify({ status: 1, msg: "Hợp lệ", data: found }), { status: 200, headers });
        } catch (error) {
            return new Response(JSON.stringify({ status: 0, msg: "Lỗi: " + error.message }), { status: 200, headers });
        }
    }

    // ============ CÁC ACTION CÒN LẠI: CẦN PASSWORD ============
    if (password !== ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ status: 0, msg: "Mật khẩu sai" }), { status: 200, headers });
    }

    if (request.method === "GET") {
        return new Response(JSON.stringify({ status: 1, keys }), { status: 200, headers });
    }

    if (request.method === "POST") {
        try {
            const body = await request.json();

            if (action === "add") {
                const soLuong = parseInt(body.quantity, 10) || 1;
                const soNgay = parseInt(body.duration, 10) || 7;

                for (let i = 0; i < soLuong; i++) {
                    keys.unshift({
                        id: Date.now() + "-" + Math.random().toString(36).substring(2, 9),
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
            } else if (action === "delete") {
                keys = keys.filter(k => k.id !== body.id);
            } else if (action === "toggle") {
                keys = keys.map(k => k.id === body.id ? { ...k, active: !k.active } : k);
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