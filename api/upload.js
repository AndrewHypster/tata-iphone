import formidable from "formidable";
import fs from "fs";
import fetch from "node-fetch";
import FormData from "form-data";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  const form = new formidable.IncomingForm({ multiples: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(500).send("Помилка обробки файлу");
    }

    const BOT_TOKEN = process.env.BOT_TOKEN;
    const CHAT_ID = process.env.CHAT_ID;

    let photos = files.photos;
    if (!Array.isArray(photos)) photos = [photos];

    try {
      for (const photo of photos) {
        // перевіряємо ліміт перед відправкою
        const size = fs.statSync(photo.filepath).size;
        if (size > 50 * 1024 * 1024) {
          console.error(`Файл ${photo.originalFilename} > 50MB`);
          continue; // пропускаємо надто великий файл
        }

        const formData = new FormData();
        formData.append("chat_id", CHAT_ID);
        formData.append("document", fs.createReadStream(photo.filepath), {
          filename: photo.originalFilename,
        });

        const response = await fetch(
          `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`,
          {
            method: "POST",
            body: formData,
            headers: formData.getHeaders(),
          }
        );

        const data = await response.json();
        if (!data.ok) {
          console.error("Telegram error:", data);
        }
      }

      res.status(200).send("OK");
    } catch (e) {
      console.error("Send error:", e);
      res.status(500).send("Помилка надсилання у Telegram");
    }
  });
}