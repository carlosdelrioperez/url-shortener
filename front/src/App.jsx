import { useState, useEffect } from "react";
import { FiCopy, FiTrash2 } from "react-icons/fi";

function App() {
  const [url, setUrl] = useState("");
  const [shortUrlData, setShortUrlData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedUrl, setCopiedUrl] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Cargar historial de localStorage al inicio
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("urlHistory")) || [];
    setHistory(saved);
  }, []);

  // Intervalo para actualizar expiración en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setHistory((prevHistory) =>
        prevHistory.map((item) => {
          const isExpired =
            item.expiresAt && new Date(item.expiresAt) < new Date();
          return { ...item, isExpired };
        })
      );
    }, 1000); // cada 1 segundo

    return () => clearInterval(interval);
  }, []);

  const saveToLocalStorage = (urls) => {
    localStorage.setItem("urlHistory", JSON.stringify(urls));
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return /^(https?:\/\/)/i.test(string);
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url) return;
    if (!isValidUrl(url)) {
      setError("URL no válida");
      return;
    }

    setLoading(true);
    setError("");
    setShortUrlData(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/shorten`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalUrl: url }),
      });

      const data = await res.json();
      if (res.ok) {
        const newUrl = {
          _id: Date.now(),
          shortId: data.shortUrl.split("/").pop(),
          originalUrl: url,
          shortUrl: data.shortUrl,
          clicks: 0,
          expiresAt: data.expiresAt, // fecha de expiración del backend
          isExpired: false,
        };

        const updatedHistory = [newUrl, ...history];
        setHistory(updatedHistory);
        saveToLocalStorage(updatedHistory);

        setShortUrlData({ url: data.shortUrl, clicks: 0 });
        setUrl("");
      } else {
        setError(data.error || "Error desconocido");
      }
    } catch (err) {
      setError("Error de conexión", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (shortId) => {
    const updatedHistory = history.filter((item) => item.shortId !== shortId);
    setHistory(updatedHistory);
    saveToLocalStorage(updatedHistory);
  };

  const handleCopy = (shortUrl) => {
    navigator.clipboard.writeText(shortUrl).then(() => {
      setCopiedUrl(shortUrl);
      setTimeout(() => setCopiedUrl(""), 1000);
    });
  };

  const filteredHistory = history.filter((item) =>
    item.originalUrl.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-start p-6 gap-6">
      {/* Card del formulario */}
      <div className="bg-gray-800 shadow-2xl rounded-3xl p-8 w-full max-w-lg">
        <h1 className="text-4xl font-extrabold text-white text-center mb-4">
          URL Shortener
        </h1>
        <p className="text-center text-gray-300 mb-6">
          Acorta tus enlaces de manera rápida y sencilla
        </p>

        <form
          className="flex flex-col sm:flex-row gap-3"
          onSubmit={handleSubmit}
        >
          <input
            type="url"
            placeholder="Pega tu enlace aquí"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 p-3 rounded-lg border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-gray-500 transition"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition transform hover:scale-105 disabled:opacity-50"
          >
            {loading ? "Acortando..." : "Acortar"}
          </button>
        </form>

        {shortUrlData && (
          <div className="mt-6 p-4 bg-gray-700 rounded-lg shadow-inner text-center relative">
            <p className="text-gray-200 font-medium">Tu enlace corto:</p>
            <div className="flex justify-center items-center gap-2 mt-1 flex-wrap">
              <a
                href={shortUrlData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline break-all hover:text-blue-300"
              >
                {shortUrlData.url}
              </a>
              <div className="relative">
                <button
                  onClick={() => handleCopy(shortUrlData.url)}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded transition transform hover:scale-110"
                >
                  <FiCopy size={18} />
                </button>
                {copiedUrl === shortUrlData.url && (
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-white text-xs font-medium">
                    Copiado
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-800 rounded-lg shadow-inner text-center">
            <p className="text-red-200 font-medium">{error}</p>
          </div>
        )}
      </div>

      {/* Card del historial */}
      {history.length > 0 && (
        <div className="bg-gray-800 shadow-2xl rounded-3xl p-6 w-full max-w-lg flex flex-col">
          <h2 className="text-2xl text-white font-semibold mb-4 text-center">
            Mis URLs
          </h2>

          {/* Buscador */}
          <input
            type="text"
            placeholder="Buscar URL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 rounded-lg border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-gray-500 mb-4"
          />

          <ul className="space-y-4">
            {filteredHistory.map((item) => (
              <li
                key={item._id}
                className={`bg-gray-900 border-l-4 ${
                  item.isExpired ? "border-red-500" : "border-blue-500"
                } p-4 rounded-xl shadow-md transition hover:shadow-lg hover:scale-[1.01] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3`}
              >
                <div className="flex-1">
                  <p
                    className={`font-medium break-all ${
                      item.isExpired
                        ? "text-gray-500 line-through"
                        : "text-gray-200"
                    }`}
                  >
                    {item.originalUrl}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Creada: {new Date(item._id).toLocaleString()}
                  </p>
                  {item.isExpired && (
                    <p className="text-red-400 text-xs mt-1 font-semibold">
                      URL Expirada
                    </p>
                  )}
                </div>

                <div className="flex gap-2 items-center">
                  <div className="relative">
                    <button
                      disabled={item.isExpired}
                      onClick={() => handleCopy(item.shortUrl)}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition transform hover:scale-110 disabled:opacity-50"
                      title={
                        item.isExpired ? "URL Expirada" : "Copiar URL corta"
                      }
                    >
                      <FiCopy size={18} />
                    </button>
                    {copiedUrl === item.shortUrl && !item.isExpired && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-white text-xs font-medium">
                        Copiado
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(item.shortId)}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition transform hover:scale-110"
                    title="Eliminar URL"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
