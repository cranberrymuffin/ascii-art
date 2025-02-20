import { removeBackground } from '@imgly/background-removal';

export const getFontMetrics = (): { charWidth: number; charHeight: number } => {
  const fontSize = 4; // Font size in pixels (adjustable)

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  context.font = `${fontSize}px 'Courier New', monospace`;

  const charWidth = context.measureText('@').width; // 'M' is a good sample character to measure width
  const charHeight = fontSize; // Typically, height is the same as the font size for monospace fonts

  return { charWidth, charHeight };
};

export const calculateDimensions = (): { width: number; height: number } => {
  const { charWidth, charHeight } = getFontMetrics();
  const maxWidth = window.innerWidth; // 80% of the viewport width
  const maxHeight = window.innerHeight; // 80% of the viewport height

  const cols = Math.floor(maxWidth / charWidth);
  const rows = Math.floor(maxHeight / charHeight);

  return { width: cols, height: rows };
};

export const convertToAscii = (
  image: HTMLImageElement,
  width: number,
  height: number,
  asciiChars: string[],
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

const trimEmptyLines = (str: string) => {
  return str
    .split('\n')
    .filter(line => line.trim() !== '')
    .join('\n');
};

export const processImage = async (
  imageSource: Blob | string,
  setImageUrl: React.Dispatch<React.SetStateAction<string | null>>,
  setAsciiArt: React.Dispatch<React.SetStateAction<string | null>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setIsAsciiVisible: React.Dispatch<React.SetStateAction<boolean>>,
  asciiChars: string[],
) => {
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
      const { width: maxWidth, height: maxHeight } = calculateDimensions();

      const aspectRatio = image.naturalWidth / image.naturalHeight;

      let width = maxWidth;
      let height = Math.floor(width / aspectRatio);

      if (height > maxHeight) {
        height = maxHeight;
        width = Math.floor(height * aspectRatio);
      }

      const ascii = convertToAscii(image, width, height, asciiChars);
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
