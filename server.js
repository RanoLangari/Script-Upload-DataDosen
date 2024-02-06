import express from "express";
import dotenv from "dotenv";
import db from "./db/dbFirestore.js";
import multer from "multer";
import { readFile } from "fs/promises";
import xlsx from "xlsx";
import fs from "fs";
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("public"));
const upload = multer({ dest: "uploads/" });

app.get("/", (req, res) => {
  res.send("Hello World");
});
app.post("/uploadDataDosen", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).send("No file uploaded");
      return;
    }

    // Read the uploaded file
    const buffer = await readFile(req.file.path);
    const workbook = xlsx.read(buffer, { type: "buffer" });

    // Convert the first worksheet to JSON with first colomn key is nama and second colomn key is jurusan
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    const dosen = data.map((item) => {
      return {
        nama: item[0],
        jurusan: item[1],
      };
    });

    // Insert the JSON data to Firestore using loop
    for (let i = 0; i < dosen.length; i++) {
      await db.collection("dosen").add(dosen[i]);
    }

    // Delete the uploaded file
    fs.unlinkSync(req.file.path);

    res.send("Data uploaded successfully");
  } catch (error) {
    console.error("error pada uploadDataDosen: ", error);
  }
});

app.use("*", (req, res) => {
  res.status(404).json({ error: "Not Found" });
});
app.listen(8080, () => {
  console.log("Server is running on port 8080");
});
