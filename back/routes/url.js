const express = require("express");
const router = express.Router();
const shortid = require("shortid");
const Url = require("../models/Url");

// Crear URL corta con expiración (por defecto 24h)
router.post("/shorten", async (req, res) => {
  const { originalUrl, expiresIn } = req.body; // expiresIn opcional en horas
  const shortId = shortid.generate();

  try {
    const expirationHours = expiresIn ? Number(expiresIn) : 1;
    const expiresAt = new Date(Date.now() + expirationHours * 60 * 1000);

    const newUrl = await Url.create({
      originalUrl,
      shortId,
      expiresAt,
    });

    res.json({
      shortUrl: `${process.env.BASE_URL}/api/${shortId}`,
      clicks: 0,
      expiresAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear la URL" });
  }
});

// Obtener todas las URLs
router.get("/all", async (req, res) => {
  try {
    const urls = await Url.find().sort({ createdAt: -1 });
    res.json(urls);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener historial de URLs" });
  }
});

// Redirigir desde la URL corta
router.get("/:shortId", async (req, res) => {
  const { shortId } = req.params;

  try {
    const url = await Url.findOne({ shortId });
    if (!url) {
      // URL no encontrada o expirada
      return res.status(410).json({ error: "URL expirada o no encontrada" });
    }

    url.clicks += 1;
    await url.save();
    return res.redirect(url.originalUrl);
  } catch (err) {
    res.status(500).json({ error: "Error al redirigir" });
  }
});

// Eliminar URL por shortId
router.delete("/:shortId", async (req, res) => {
  const { shortId } = req.params;

  try {
    const deleted = await Url.findOneAndDelete({ shortId });
    if (!deleted) {
      return res.status(404).json({ error: "URL no encontrada" });
    }
    res.json({ message: "URL eliminada correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar URL" });
  }
});

module.exports = router;
