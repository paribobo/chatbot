/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from 'react';

type File = { id: string; name: string };

export default function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentText, setDocumentText] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/files')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setFiles(data);
        } else {
          setFiles([]);
        }
      })
      .catch(() => setFiles([]));
  }, []);

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  const handleFileSelect = async (fileId: string) => {
    const file = files.find(f => f.id === fileId)!;
    setSelectedFile(file);
    setLoading(true);
    const res = await fetch(`/api/file/${fileId}/content`);
    const data = await res.json();
    setDocumentText(data.text);
    setLoading(false);
  };

  const handleChat = async () => {
    setLoading(true);
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, documentText }),
    });
    const data = await res.json();
    setResponse(data.response);
    setLoading(false);
  };

  return (
    <div className="flex flex-col w-full h-screen bg-gray-50 font-sans text-gray-900">
      {/* Top Navigation Bar */}
      <nav className="h-16 flex items-center justify-between px-8 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-sm flex items-center justify-center text-white font-bold">D</div>
          <span className="text-xl font-bold tracking-tight">DOCUQUERY AI</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            System Online
          </div>
        </div>
      </nav>

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar: Document Management */}
        <aside className="w-80 bg-white border-r border-gray-200 flex flex-col p-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Select Document</h3>
          <select 
            onChange={(e) => handleFileSelect(e.target.value)}
            className="w-full p-3 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 text-sm font-medium focus:border-indigo-400"
            disabled={loading}
          >
            <option value="">Choose a PDF...</option>
            {files.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          {loading && <LoadingSpinner />}
        </aside>

        {/* Main Chat Window */}
        <section className="flex-1 flex flex-col bg-white relative">
          <div className="flex-1 p-8 space-y-6 overflow-y-auto">
            {selectedFile && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold border-b pb-4 mb-4">Chat with {selectedFile.name}</h2>
                {loading && <LoadingSpinner />}
                {response && !loading && (
                  <div className="bg-gray-50 border border-gray-100 p-6 rounded-2xl">
                    <h3 className="font-bold text-indigo-900 mb-2">Response:</h3>
                    <p className="text-gray-800 leading-relaxed">{response}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="p-8 border-t">
            <div className="relative flex items-center bg-white border-2 border-gray-200 rounded-2xl shadow-sm focus-within:border-indigo-500 transition-all">
              <input 
                type="text" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask about your document..." 
                className="flex-1 py-4 px-6 outline-none text-gray-700"
                disabled={loading}
              />
              <button 
                onClick={handleChat}
                className="bg-indigo-600 text-white p-3 mr-2 rounded-xl hover:bg-indigo-700"
                disabled={loading}
              >
                {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Ask'}
              </button>
            </div>
            <p className="mt-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">AI may hallucinate. Always verify facts.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
