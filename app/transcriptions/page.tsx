"use client";

import { useState } from "react";

export default function TranscriptionPage() {
  const [audioUrl, setAudioUrl] = useState("");
  const [message, setMessage] = useState("");
  const [transcriptions, setTranscriptions] = useState<any[]>([]);

  const handleSubmit = async () => {
    if (!audioUrl.trim()) {
      setMessage("Please enter a valid audio URL");
      return;
    }

    setMessage("Processing...");

    try {
      const res = await fetch("/api/transcription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioUrl }),
      });

      const data = await res.json();

      if (!data.success) {
        setMessage("Error: " + data.error);
        return;
      }

      setMessage(`Transcription saved with ID: ${data.id}`);
    } catch (err) {
      setMessage("Something went wrong.");
    }
  };

  const fetchTranscriptions = async () => {
    const res = await fetch("/api/transcription");
    const data = await res.json();
    setTranscriptions(data.data || []);
  };

  return (
    <div style={{ padding: 30, maxWidth: 600 }}>
      <h2>Transcription Demo</h2>

      {/* User input box */}
      <input
        type="text"
        placeholder="Enter audio URL"
        value={audioUrl}
        onChange={(e) => setAudioUrl(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          marginBottom: 15,
          borderRadius: 6,
          border: "1px solid #ccc",
        }}
      />

      <button
        onClick={handleSubmit}
        style={{
          padding: "10px 20px",
          background: "#0070f3",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Submit for Transcription
      </button>

      {/* Message display */}
      {message && (
        <p style={{ marginTop: 20, fontWeight: "bold" }}>{message}</p>
      )}

      <hr style={{ margin: "30px 0" }} />

      {/* List Transcriptions */}
      <button
        onClick={fetchTranscriptions}
        style={{
          padding: "10px 20px",
          background: "#444",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Load Last 30 Days Transcriptions
      </button>

      <ul style={{ marginTop: 20 }}>
        {transcriptions.map((t) => (
          <li key={t._id} style={{ marginBottom: 15 }}>
            <strong>ID:</strong> {t._id} <br />
            <strong>URL:</strong> {t.audioUrl} <br />
            <strong>Text:</strong> {t.transcription} <br />
            <strong>Created:</strong> {new Date(t.createdAt).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}