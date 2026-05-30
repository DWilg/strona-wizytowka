const TELEGRAM_TOKEN  = "8947475703:AAG3PimrKm9ORXHJpukpYNhiNMKjUHmhgm0";
const ALLOWED_CHAT_ID = 0;
const R2_PUBLIC_URL   = "https://galeria-worker.dawidwilgucki9.workers.dev/images";
const MAX_PHOTOS = 8;
const KV_KEY     = "photos";
const TGAPI      = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

export default {
  async fetch(request, env) {
    const url    = new URL(request.url);
    const method = request.method;

    if (method === "GET" && url.pathname === "/api/galeria") {
      const photos = await getPhotos(env);
      return jsonResponse(photos);
    }

    if (method === "GET" && url.pathname.startsWith("/images/")) {
      const key    = url.pathname.replace("/images/", "");
      const object = await env.R2_BUCKET.get(key);
      if (!object) return new Response("Not found", { status: 404 });
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("Cache-Control", "public, max-age=31536000");
      return new Response(object.body, { headers });
    }

    if (method === "POST" && url.pathname === "/webhook") {
      const update = await request.json().catch(() => null);
      if (update) await handleUpdate(update, env);
      return new Response("OK");
    }

    return new Response("Not found", { status: 404 });
  },
};

async function getPhotos(env) {
  const raw = await env.GALERIA_KV.get(KV_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function savePhotos(env, photos) {
  await env.GALERIA_KV.put(KV_KEY, JSON.stringify(photos));
}

async function handleUpdate(update, env) {
  const msg = update.message;
  if (!msg) return;

  const chatId = msg.chat.id;
  if (chatId !== ALLOWED_CHAT_ID) {
    await tgSend(chatId, `Brak dostępu. Twoje Chat ID to: ${chatId}`);
    return;
  }

  if (!msg.photo || !msg.caption) {
    await tgSend(chatId, "Wyślij zdjęcie z podpisem (caption), żeby dodać je do galerii.");
    return;
  }

  const photo     = msg.photo[msg.photo.length - 1];
  const fileId    = photo.file_id;
  const opis      = msg.caption.trim();
  const timestamp = Date.now();
  const filename  = `${timestamp}.jpg`;

  const fileRes  = await fetch(`${TGAPI}/getFile?file_id=${fileId}`);
  const fileData = await fileRes.json();
  if (!fileData.ok) {
    await tgSend(chatId, "Błąd: nie udało się pobrać pliku z Telegrama.");
    return;
  }

  const filePath = fileData.result.file_path;
  const imgRes = await fetch(`https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}`);
  if (!imgRes.ok) {
    await tgSend(chatId, "Błąd: nie udało się pobrać obrazu.");
    return;
  }

  const imgBuffer = await imgRes.arrayBuffer();
  await env.R2_BUCKET.put(filename, imgBuffer, {
    httpMetadata: { contentType: "image/jpeg" },
  });

  const photos = await getPhotos(env);
  photos.push({ id: timestamp, url: `${R2_PUBLIC_URL}/${filename}`, opis });
  while (photos.length > MAX_PHOTOS) {
    const oldest = photos.shift();
    await env.R2_BUCKET.delete(oldest.url.split("/").pop());
  }
  await savePhotos(env, photos);
  await tgSend(chatId, `✅ Zdjęcie dodane do galerii (${photos.length}/${MAX_PHOTOS}).\nOpis: ${opis}`);
}

async function tgSend(chatId, text) {
  await fetch(`${TGAPI}/sendMessage`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ chat_id: chatId, text }),
  });
}

function jsonResponse(data) {
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type":                "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
