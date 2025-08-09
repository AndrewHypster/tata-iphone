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

    console.log("Received files:", files);

    const BOT_TOKEN = process.env.BOT_TOKEN;
    const CHAT_ID = process.env.CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      console.error("Missing BOT_TOKEN or CHAT_ID in env");
      return res.status(500).send("Server config error");
    }

    let photos = files.photos;
    if (!photos) {
      console.error("No photos field in files");
      return res.status(400).send("No photos uploaded");
    }

    if (!Array.isArray(photos)) photos = [photos];

    try {
      for (const photo of photos) {
        const formData = new FormData();
        formData.append("chat_id", CHAT_ID);
        formData.append("photo", fs.createReadStream(photo.filepath));

        const telegramResponse = await fetch(
          `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
          {
            method: "POST",
            body: formData,
            headers: formData.getHeaders(),
          }
        );

        const telegramData = await telegramResponse.json();
        console.log("Telegram API response:", telegramData);

        if (!telegramResponse.ok || !telegramData.ok) {
          return res.status(500).send(
            "Telegram API error: " + (telegramData.description || "Unknown error")
          );
        }
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error("Send photo error:", error);
      res.status(500).send("Помилка надсилання у Telegram");
    }
  });
}
