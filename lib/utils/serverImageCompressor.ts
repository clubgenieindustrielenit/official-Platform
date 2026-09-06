import sharp from "sharp";

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "jpeg" | "webp" | "png" | "auto";
}

export interface CompressionResult {
  buffer: Buffer;
  contentType: string;
  extension: string;
}

/**
 * Server-side image compression.
 * Compresses image quality WITHOUT cropping or altering aspect ratio.
 * Preserves original proportions and dimensions (with safe max bounds 2560px for extreme camera shots).
 *
 * @param inputBuffer - Raw image buffer (from File / fetch / FormData)
 * @param options - Custom compression settings
 */
export async function compressImageBuffer(
  inputBuffer: Buffer | Uint8Array,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 2560,
    maxHeight = 2560,
    quality = 82,
    format = "auto",
  } = options;

  try {
    const image = sharp(inputBuffer);
    const metadata = await image.metadata();

    // If SVG or unknown, return original buffer
    if (metadata.format === "svg") {
      return {
        buffer: Buffer.from(inputBuffer),
        contentType: "image/svg+xml",
        extension: "svg",
      };
    }

    // Auto-rotate according to EXIF orientation
    let pipeline = image.rotate();

    // Only resize if image exceeds max bounds, preserving exact aspect ratio with NO CROPPING
    if (
      metadata.width &&
      metadata.height &&
      (metadata.width > maxWidth || metadata.height > maxHeight)
    ) {
      pipeline = pipeline.resize({
        width: maxWidth,
        height: maxHeight,
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // Determine target format
    let targetFormat = format;
    if (targetFormat === "auto") {
      if (metadata.hasAlpha || metadata.format === "png") {
        targetFormat = "webp"; // WebP preserves alpha with great compression
      } else {
        targetFormat = "jpeg";
      }
    }

    if (targetFormat === "webp") {
      const outputBuffer = await pipeline
        .webp({ quality, effort: 4 })
        .toBuffer();
      return {
        buffer: outputBuffer,
        contentType: "image/webp",
        extension: "webp",
      };
    } else if (targetFormat === "png") {
      const outputBuffer = await pipeline
        .png({ quality, compressionLevel: 8 })
        .toBuffer();
      return {
        buffer: outputBuffer,
        contentType: "image/png",
        extension: "png",
      };
    } else {
      const outputBuffer = await pipeline
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
      return {
        buffer: outputBuffer,
        contentType: "image/jpeg",
        extension: "jpg",
      };
    }
  } catch (error) {
    console.error("Image compression error, falling back to original buffer:", error);
    return {
      buffer: Buffer.from(inputBuffer),
      contentType: "image/jpeg",
      extension: "jpg",
    };
  }
}
