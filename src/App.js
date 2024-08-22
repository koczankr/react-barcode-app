import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useBarcode } from 'next-barcode';

function BarcodeImage({ value, onGenerated }) {
  const { inputRef } = useBarcode({
    value: value,
  });

  useEffect(() => {
    if (inputRef.current) {
      // Létrehozzuk a canvas elemet
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = inputRef.current.src;
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imgSrc = canvas.toDataURL('image/png');
        onGenerated(value, imgSrc);
      };
    }
  }, [inputRef, value, onGenerated]);

  return <img ref={inputRef} alt={`barcode_${value}`} style={{ display: 'none' }} />;
}

function App() {
  const [input, setInput] = useState('');
  const [barcodes, setBarcodes] = useState([]);
  const [generatedImages, setGeneratedImages] = useState([]);

  useEffect(() => {
    const numbers = input.split('\n').filter(num => num.trim() !== '');
    setBarcodes(numbers);
    setGeneratedImages([]); // Minden új inputnál tisztítjuk a generált képeket
  }, [input]);

  const handleGeneratedImage = (number, imgSrc) => {
    setGeneratedImages(prev => [...prev, { number, imgSrc }]);
  };

  const downloadZip = async () => {
    if (generatedImages.length === 0) {
      console.log('Nincsenek generált vonalkódok.');
      return;
    }

    console.log('Vonalkódok generálása elkezdődött...');
    const zip = new JSZip();

    generatedImages.forEach(({ number, imgSrc }) => {
      const base64Data = imgSrc.split(',')[1];
      zip.file(`barcode_${number.trim()}.png`, base64Data, { base64: true });
    });

    try {
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'barcodes.zip');
      console.log('ZIP fájl sikeresen letöltve.');
    } catch (err) {
      console.error('Hiba történt a ZIP fájl generálása közben', err);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Code 128B Vonalkód generátor</h2>
      <textarea
        rows="10"
        cols="50"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Illeszd be a számokat, ENTER-rel elválasztva"
      />
      <br />
      <button onClick={downloadZip}>Vonalkódok generálása és letöltése</button>
      <div style={{ display: 'none' }}>
        {barcodes.map((barcode, index) => (
          <BarcodeImage key={index} value={barcode} onGenerated={handleGeneratedImage} />
        ))}
      </div>
    </div>
  );
}

export default App;
