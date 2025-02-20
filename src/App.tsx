import React, { useState, ChangeEvent } from 'react';
import { removeBackground } from '@imgly/background-removal';
import './style.css'; // Import the styles

const App = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [asciiArt, setAsciiArt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [isAsciiVisible, setIsAsciiVisible] = useState<boolean>(false);

  const asciiChars: string[] = [
    '@',
    '%',
    '#',
    '*',
    '+',
    '=',
    '-',
    ':',
    '.',
    ' ',
  ];

  function getFontMetrics(): { charWidth: number; charHeight: number } {
    const fontSize = 4; // Font size in pixels (adjustable)

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    context.font = `${fontSize}px 'Courier New', monospace`;

    const charWidth = context.measureText('@').width;
    const charHeight = fontSize;

    return { charWidth, charHeight };
  }

  const calculateDimensions = (
    image: HTMLImageElement,
  ): { width: number; height: number } => {
    const { charWidth, charHeight } = getFontMetrics();
    const maxWidth = window.innerWidth;
    const maxHeight = window.innerHeight;

    const cols = Math.floor(maxWidth / charWidth);
    const rows = Math.floor(maxHeight / charHeight);

    return { width: cols, height: rows };
  };

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

    return trimEmptyLines(asciiStr);
  };

  function trimEmptyLines(str: string) {
    return str
      .split('\n')
      .filter(line => line.trim() !== '')
      .join('\n');
  }

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
        // Step 1: Get max dimensions
        const { width: maxWidth, height: maxHeight } =
          calculateDimensions(image);

        // Step 2: Calculate the aspect ratio of the image
        const aspectRatio = image.naturalWidth / image.naturalHeight;

        // Step 3: Scale image dimensions while maintaining aspect ratio
        let width = maxWidth;
        let height = Math.floor(width / aspectRatio);

        if (height > maxHeight) {
          height = maxHeight;
          width = Math.floor(height * aspectRatio);
        }

        // Step 4: Create canvas to crop whitespace
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        ctx.drawImage(image, 0, 0);

        // Find bounding box of non-transparent pixels
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        let left = canvas.width,
          top = canvas.height,
          right = 0,
          bottom = 0;

        // Loop through pixels to find the bounding box
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const i = (y * canvas.width + x) * 4;
            const alpha = data[i + 3];

            if (alpha > 0) {
              left = Math.min(left, x);
              top = Math.min(top, y);
              right = Math.max(right, x);
              bottom = Math.max(bottom, y);
            }
          }
        }

        // Crop the image based on bounding box
        const croppedImageData = ctx.getImageData(
          left,
          top,
          right - left,
          bottom - top,
        );
        canvas.width = right - left;
        canvas.height = bottom - top;
        ctx.putImageData(croppedImageData, 0, 0);

        // Step 5: Generate ASCII art from cropped image
        const croppedImage = new Image();
        croppedImage.onload = () => {
          const ascii = convertToAscii(croppedImage, width, height);
          setAsciiArt(ascii);
          setIsLoading(false);
          setIsAsciiVisible(true);
        };
        croppedImage.src = canvas.toDataURL(); // Set the cropped image as source for ASCII conversion
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
              <div className="input-group">
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
              </div>
              <div>
                <input
                  type="file"
                  id="file-input"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="file-input"
                />
                <label htmlFor="file-input" className="file-input-label">
                  Choose File
                </label>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
