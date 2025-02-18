import React, { useState, ChangeEvent } from 'react';
import { removeBackground } from '@imgly/background-removal';

const App: React.FC = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false); // Track loading state

  // Handle file input change
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImageUrl(imageUrl);
      setIsLoading(true); // Start loading

      try {
        const removedBlob = await removeBackground(file);
        if (removedBlob) {
          const url = URL.createObjectURL(removedBlob);
          setImageUrl(url); // Set the new image with background removed
        } else {
          console.error('No background removed, returned blob is empty.');
        }
      } catch (error) {
        console.error('Error removing background:', error);
      } finally {
        setIsLoading(false); // End loading
      }
    }
  };

  return (
    <div>
      {isLoading ? (
        <p>Loading...</p> // Display loading message while processing
      ) : (
        imageUrl && <img src={imageUrl} alt="Processed" /> // Display image once background is removed
      )}
      <input type="file" onChange={handleFileChange} accept="image/*" />
    </div>
  );
};

export default App;
