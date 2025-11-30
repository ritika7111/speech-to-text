"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  type AzureTx = {
    _id: string;
    audioUrl: string;
    transcription: string;
    language?: string;
    createdAt: string;
  };
  const [items, setItems] = useState<AzureTx[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(5);
  const [total, setTotal] = useState<number>(0);
  const [pages, setPages] = useState<number>(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const PREVIEW_LEN = 36;

  const uploadAudio = async (file: Blob | File) => {
    setLoading(true);

    const formData = new FormData();
    formData.append("audio", file);

    const res = await fetch("/api/azure-stt", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    setText(data.DisplayText || "No text detected");
    setLoading(false);
    await fetchItems(page);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAudio(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) uploadAudio(file);
  };

  const fetchItems = async (p: number = 1) => {
    const res = await fetch(`/api/azure-stt?page=${p}&limit=${limit}`);
    const data = await res.json();
    setItems(data.data || []);
    setPage(data.page || p);
    setTotal(data.total || 0);
    setPages(data.pages || 0);
  };

  useEffect(() => {
    fetchItems(1);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-black">
      <header className="border-b border-white/10 bg-black/30">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-wide">Azure Upload & Transcriptions</h1>
          <span className="text-gray-300 text-sm">Total: {total}</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-2xl shadow-xl">
              <h2 className="text-white text-lg mb-4">Upload Audio</h2>
              <label
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="flex items-center justify-center h-40 border-2 border-dashed border-white/30 rounded-xl cursor-pointer hover:border-blue-400 transition"
              >
                <input type="file" accept="audio/*" className="hidden" onChange={handleFileSelect} />
                <div className="text-center text-gray-200">
                  <div className="text-5xl mb-3">📁</div>
                  <p className="text-sm">Drag & Drop or click to select</p>
                </div>
              </label>

              {loading && (
                <p className="mt-4 text-blue-300 animate-pulse">Transcribing…</p>
              )}

              {text && !loading && (
                <div className="mt-5 bg-black/30 text-white p-4 rounded-xl border border-white/10">
                  <div className="text-sm text-gray-300 mb-2">Latest Transcription</div>
                  <p className="leading-relaxed text-gray-200">{text}</p>
                </div>
              )}
            </div>
          </section>

          <section className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl overflow-hidden">
              <div className="px-6 py-4 flex items-center justify-between border-b border-white/10">
                <h2 className="text-white text-lg">Recent Azure Transcriptions</h2>
                <div className="text-gray-300 text-sm">Page {page} of {pages}</div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-gray-200">
                  <thead className="bg-black/40">
                    <tr>
                      <th className="px-6 py-3">ID</th>
                      <th className="px-6 py-3">File</th>
                      <th className="px-6 py-3">Transcript</th>
                      <th className="px-6 py-3">Language</th>
                      <th className="px-6 py-3">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((t) => (
                      <tr key={t._id} className="odd:bg-black/20">
                        <td className="px-6 py-3 font-mono text-xs">{t._id}</td>
                        <td className="px-6 py-3">{t.audioUrl}</td>
                        <td className="px-6 py-3 relative">
                          <div className="flex items-center gap-2">
                            <span
                              className="block overflow-hidden whitespace-nowrap text-ellipsis"
                              title={t.transcription}
                            >
                              {t.transcription && t.transcription.length > PREVIEW_LEN
                                ? t.transcription.slice(0, PREVIEW_LEN) + "…"
                                : t.transcription}
                            </span>
                            <button
                              onClick={() => setOpenId(openId === t._id ? null : t._id)}
                              className="px-2 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600"
                            >
                              View more
                            </button>
                          </div>

                          {openId === t._id && (
                            <div className="absolute left-6 top-full mt-2 w-[28rem] bg-black/90 text-white p-4 rounded-lg border border-white/20 shadow-xl z-10">
                              <div className="flex items-start justify-between mb-2">
                                <span className="font-semibold">Transcript details</span>
                                <button onClick={() => setOpenId(null)} className="text-gray-300 hover:text-white">✖</button>
                              </div>
                              <div className="text-sm text-gray-200">
                                <div className="max-h-40 overflow-auto mb-3">{t.transcription}</div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                  <div className="text-gray-400">ID</div>
                                  <div className="font-mono text-xs">{t._id}</div>
                                  <div className="text-gray-400">URL</div>
                                  <div>{t.audioUrl}</div>
                                  <div className="text-gray-400">Language</div>
                                  <div>{t.language || "en-US"}</div>
                                  <div className="text-gray-400">Created</div>
                                  <div>{new Date(t.createdAt).toLocaleString()}</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-3">{t.language || "en-US"}</td>
                        <td className="px-6 py-3">{new Date(t.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td className="px-6 py-6 text-center text-gray-400" colSpan={5}>No records</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 flex items-center justify-between border-t border-white/10">
                <button
                  onClick={() => { const p = Math.max(1, page - 1); fetchItems(p); }}
                  disabled={page <= 1}
                  className={`px-3 py-2 rounded-lg ${page <= 1 ? "bg-gray-700/40 text-gray-400" : "bg-gray-700 text-white"}`}
                >
                  Prev
                </button>
                <div className="text-gray-300">Showing {(items?.length || 0)} of {total}</div>
                <button
                  onClick={() => { const p = Math.min(pages || page + 1, page + 1); fetchItems(p); }}
                  disabled={pages > 0 && page >= pages}
                  className={`px-3 py-2 rounded-lg ${pages > 0 && page >= pages ? "bg-gray-700/40 text-gray-400" : "bg-gray-700 text-white"}`}
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
