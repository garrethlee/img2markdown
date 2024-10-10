import React, { useState, useCallback, useEffect } from 'react';
import { createWorker } from 'tesseract.js';
import { Loader, Upload, Copy, Image as ImageIcon } from 'lucide-react';

function Toast({ message, isVisible, onHide }: { message: string; isVisible: boolean; onHide: () => void }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onHide();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onHide]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg transition-opacity duration-300">
      {message}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-4 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      <div className="h-4 bg-gray-200 rounded w-4/6"></div>
    </div>
  );
}

function App() {
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        handleImageUpload(file);
      }
    },
    [handleImageUpload]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleImageUpload(file);
          }
          break;
        }
      }
    },
    [handleImageUpload]
  );

  const performOCR = useCallback(async () => {
    if (!image) return;

    // Reset previously converted texts
    setText('');
    setMarkdown('');

    setLoading(true);
    const worker = await createWorker('eng');
    const {
      data: { text },
    } = await worker.recognize(image);
    await worker.terminate();

    setText(text);
    setMarkdown(text); // Set the extracted text directly as Markdown
    setLoading(false);
  }, [image]);

  const copyToClipboard = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
    setShowToast(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">🤓 EZ-IMG-2-TXT</h1>

        <div
          className="border-dashed border-2 border-gray-300 rounded-lg p-8 mb-6 text-center cursor-pointer"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onPaste={handlePaste}
        >
          {image ? (
            <img
              src={image}
              alt="Uploaded"
              className="max-w-full h-auto mx-auto"
            />
          ) : (
            <div>
              <Upload className="mx-auto mb-2" size={48} />
              <p>Drag and drop an image here, or paste from clipboard</p>
            </div>
          )}
        </div>

        <div className="flex justify-center mb-6">
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center"
            onClick={performOCR}
            disabled={!image || loading}
          >
            {loading ? <Spinner /> : <ImageIcon className="mr-2" size={20} />}
            {loading ? 'Converting...' : 'Convert to Text'}
          </button>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Extracted Text:</h2>
          <div className="bg-gray-100 p-4 rounded-lg relative">
            {loading ? (
              <SkeletonLoader />
            ) : text ? (
              <>
                <p className="pr-12">{text}</p>
                <button
                  className="absolute top-2 right-2 bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-2 rounded text-sm flex items-center"
                  onClick={() => copyToClipboard(text)}
                >
                  <Copy className="mr-1" size={16} /> Copy
                </button>
              </>
            ) : (
              <p className="text-gray-500">No text extracted yet.</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Markdown:</h2>
          <div className="bg-gray-100 p-4 rounded-lg relative">
            {loading ? (
              <SkeletonLoader />
            ) : markdown ? (
              <>
                <pre className="whitespace-pre-wrap pr-12">{markdown}</pre>
                <button
                  className="absolute top-2 right-2 bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-2 rounded text-sm flex items-center"
                  onClick={() => copyToClipboard(markdown)}
                >
                  <Copy className="mr-1" size={16} /> Copy
                </button>
              </>
            ) : (
              <p className="text-gray-500">No markdown generated yet.</p>
            )}
          </div>
        </div>
      </div>
      <Toast message="Copied!" isVisible={showToast} onHide={() => setShowToast(false)} />
    </div>
  );
}

export default App;