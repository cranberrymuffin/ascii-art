import React, { useState, ChangeEvent } from 'react';
import { removeBackground } from '@imgly/background-removal';
import './style.css'; // Import the styles

const App = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [asciiArt, setAsciiArt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [isAsciiVisible, setIsAsciiVisible] = useState<boolean>(false);

  const asciiChars: string[] = ['@', '#', '8', '&', 'o', ':', '*', '.', ' '];

  const convertToAscii = (
    image: HTMLImageElement,
    width: number,
    height: number,
  ): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    let asciiStr = '';

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];

      if (a < 128) {
        asciiStr += ' ';
      } else {
        const brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const charIndex = Math.floor(
          (brightness / 255) * (asciiChars.length - 1),
        );
        asciiStr += asciiChars[charIndex];
      }

      if ((i / 4 + 1) % width === 0) {
        asciiStr += '\n';
      }
    }

    return asciiStr.replace(/^(?:\s*\n)+/, '').trimEnd();
  };

  const processImage = async (imageSource: Blob | string) => {
    setIsLoading(true);

    try {
      let imageUrl;
      let imageBlob: Blob | null = null;

      if (typeof imageSource === 'string') {
        const response = await fetch(imageSource);
        if (!response.ok) {
          throw new Error('Failed to fetch image');
        }
        imageBlob = await response.blob();
        imageUrl = URL.createObjectURL(imageBlob);
      } else {
        imageUrl = URL.createObjectURL(imageSource);
        imageBlob = imageSource;
      }

      const removedBlob = await removeBackground(imageBlob);
      if (!removedBlob) {
        console.error('No background removed, returned blob is empty.');
        setIsLoading(false);
        return;
      }

      const url = URL.createObjectURL(removedBlob);
      setImageUrl(url);

      const image = new Image();
      image.onload = () => {
        const ascii = convertToAscii(image, 100, 100);
        setAsciiArt(ascii);
        setIsLoading(false);
        setIsAsciiVisible(true);
      };
      image.src = url;
    } catch (error) {
      console.error('Error processing image:', error);
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file) {
      processImage(file);
    }
  };

  const handleUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    setImageUrlInput(event.target.value);
  };

  const handleUrlSubmit = () => {
    if (imageUrlInput) {
      processImage(imageUrlInput);
    }
  };

  const handleBackToInput = () => {
    setIsAsciiVisible(false);
    setAsciiArt(null);
    setImageUrlInput('');
  };

  return (
    <div className="app-container">
      {isAsciiVisible ? (
        <div className="ascii-art-container">
          <pre>{asciiArt}</pre>
          <button className="go-back-btn" onClick={handleBackToInput}>
            Go Back
          </button>
        </div>
      ) : (
        <div className="input-container">
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <>
              <input
                type="text"
                value={imageUrlInput}
                onChange={handleUrlChange}
                placeholder="Enter image URL"
                className="input-field"
              />
              <button className="process-btn" onClick={handleUrlSubmit}>
                Process Image from URL
              </button>
              <br />
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                className="file-input"
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
