import React, { useState, ChangeEvent } from 'react';
import { removeBackground } from '@imgly/background-removal';

const App = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [asciiArt, setAsciiArt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [imageUrlInput, setImageUrlInput] = useState<string>('');

  // ASCII characters from dark to light
  const asciiChars: string[] = ['@', '#', '8', '&', 'o', ':', '*', '.', ' '];

  // Convert image to grayscale and then to ASCII art
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
      const a = pixels[i + 3]; // Alpha channel

      // Treat transparent pixels as white
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

    return asciiStr.trim();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImageUrl(imageUrl);
      setIsLoading(true);

      try {
        const removedBlob = await removeBackground(file);
        if (removedBlob) {
          const url = URL.createObjectURL(removedBlob);
          setImageUrl(url);

          const image = new Image();
          image.onload = () => {
            const ascii = convertToAscii(image, 100, 100); // Adjust width and height as needed
            setAsciiArt(ascii);
            setIsLoading(false);
          };
          image.src = url;
        } else {
          console.error('No background removed, returned blob is empty.');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error removing background:', error);
        setIsLoading(false);
      }
    }
  };

  const handleUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    setImageUrlInput(event.target.value);
  };

  const handleUrlSubmit = async () => {
    if (!imageUrlInput) return;

    setIsLoading(true);

    try {
      const response = await fetch(imageUrlInput);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setImageUrl(imageUrl);

      const image = new Image();
      image.onload = () => {
        const ascii = convertToAscii(image, 100, 100); // Adjust width and height as needed
        setAsciiArt(ascii);
        setIsLoading(false);
      };
      image.src = imageUrl;
    } catch (error) {
      console.error('Error fetching image:', error);
      setIsLoading(false);
    }
  };

  return (
    <div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        asciiArt && (
          <pre>
            <code>{asciiArt}</code>
          </pre>
        )
      )}

      {/* URL input for image */}
      <input
        type="text"
        value={imageUrlInput}
        onChange={handleUrlChange}
        placeholder="Enter image URL"
      />
      <button onClick={handleUrlSubmit}>Process Image from URL</button>

      {/* File input for local image */}
      <input type="file" onChange={handleFileChange} accept="image/*" />
    </div>
  );
};

export default App;
