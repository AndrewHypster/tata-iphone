import formidable from "formidable";
import fs from "fs";
import fetch from "node-fetch";

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  const form = formidable({ multiples: true });
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Помилка обробки файлу");
    }

    const BOT_TOKEN = process.env.BOT_TOKEN;
    const CHAT_ID = process.env.CHAT_ID;

    let photos = files.photos;
    if (!Array.isArray(photos)) photos = [photos];

    try {
      for (const photo of photos) {
        const formData = new FormData();
        formData.append("chat_id", CHAT_ID);
        formData.append("photo", fs.createReadStream(photo.filepath));

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
          method: "POST",
          body: formData
        });
      }
      res.status(200).send("OK");
    } catch (e) {
      console.error(e);
      res.status(500).send("Помилка надсилання у Telegram");
    }
  });
}
