import React, { useState } from 'react';
import AsciiArt from './components/AsciiArt';
import ImageInput from './components/ImageInput';
import Loading from './components/Loading';
import { processImage } from './utils/imageProcessing';
import './style.css';

const App = () => {
  const [asciiArt, setAsciiArt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [enableBackgroundRemoval, setEnableBackgroundRemoval] =
    useState<boolean>(false);

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    setSelectedFile(file);
  };

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrlInput(event.target.value);
  };

  const handleSubmit = () => {
    if (selectedFile) {
      processImage(
        selectedFile,
        setAsciiArt,
        setIsLoading,
        asciiChars,
        !enableBackgroundRemoval,
      );
    } else if (imageUrlInput) {
      processImage(
        imageUrlInput,
        setAsciiArt,
        setIsLoading,
        asciiChars,
        !enableBackgroundRemoval,
      );
    }
  };

  const handleBackToInput = () => {
    setAsciiArt(null);
    setImageUrlInput('');
    setSelectedFile(null);
  };

  return (
    <div className="app-container">
      {asciiArt ? (
        <AsciiArt asciiArt={asciiArt} onBack={handleBackToInput} />
      ) : isLoading ? (
        <Loading />
      ) : (
        <ImageInput
          imageUrlInput={imageUrlInput}
          onUrlChange={handleUrlChange}
          onFileChange={handleFileChange}
          enableBackgroundRemoval={enableBackgroundRemoval}
          onEnableBackgroundRemovalChange={e =>
            setEnableBackgroundRemoval(e.target.checked)
          }
          selectedFile={selectedFile}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

export default App;
