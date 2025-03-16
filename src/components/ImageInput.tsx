import React, { ChangeEvent } from 'react';

interface ImageInputProps {
  imageUrlInput: string;
  onUrlChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  enableBackgroundRemoval: boolean;
  onEnableBackgroundRemovalChange: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
  selectedFile: File | null;
  onSubmit: () => void;
}

const ImageInput: React.FC<ImageInputProps> = ({
  imageUrlInput,
  onUrlChange,
  onFileChange,
  enableBackgroundRemoval,
  onEnableBackgroundRemovalChange,
  selectedFile,
  onSubmit,
}) => {
  return (
    <div className="input-container">
      <div className="input-group">
        <input
          type="text"
          value={imageUrlInput}
          onChange={onUrlChange}
          placeholder="Enter image URL"
          className="input-field"
        />
      </div>
      <div>
        <input
          type="file"
          id="file-input"
          onChange={onFileChange}
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="file-input"
        />
        <label htmlFor="file-input" className="file-input-label">
          {selectedFile ? selectedFile.name : 'Choose File'}
        </label>
        <div className="format-info">
          Recommended formats:
          <ul>
            <li>JPEG/JPG for photographs</li>
            <li>PNG for images with transparency</li>
            <li>WebP for best compression</li>
          </ul>
        </div>
      </div>
      <div className="checkbox-container">
        <label>
          <input
            type="checkbox"
            checked={enableBackgroundRemoval}
            onChange={onEnableBackgroundRemovalChange}
          />
          Enable background removal
        </label>
      </div>
      <button
        className="submit-btn"
        onClick={onSubmit}
        disabled={!selectedFile && !imageUrlInput}
      >
        Convert to ASCII
      </button>
    </div>
  );
};

export default ImageInput;
