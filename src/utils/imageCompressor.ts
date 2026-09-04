/**
 * Compresses and resizes an image file to a lightweight thumbnail for avatars
 * Default max size: 128x128, Quality: 0.8
 * Resulting Base64 is typically only 2KB - 4KB (instead of 5MB - 10MB)
 */
export async function compressAvatarImage(
  file: File,
  maxDimension: number = 128,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If file is not an image, reject
    if (!file.type.startsWith('image/')) {
      return reject(new Error('File is not an image'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        return reject(new Error('Invalid reader result'));
      }

      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image into canvas'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Maintain aspect ratio and scale down if larger than maxDimension
          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve(reader.result as string);
          }

          // Use better smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw resized image
          ctx.drawImage(img, 0, 0, width, height);

          // Export as compressed JPEG data URL
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch (e) {
          // Fallback to original read result if canvas export fails
          resolve(reader.result as string);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
