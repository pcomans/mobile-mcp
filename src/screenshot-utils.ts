import { writeFileSync, existsSync, promises as fs } from "fs";
import path from "path";
import os from "os";
import { PNG } from "./png";
import { isImageMagickInstalled, Image } from "./image-utils";
import { ActionableError, ScreenSize } from "./robot";
import { trace } from "./logger";

export interface ScreenshotOptions {
	outputDir?: string;
}

export interface ProcessedScreenshot {
	buffer: Buffer;
	mimeType: string;
}

export class ScreenshotManager {
	public static async processScreenshot(
		screenshotBuffer: Buffer,
		screenSize: ScreenSize
	): Promise<ProcessedScreenshot> {
		const image = new PNG(screenshotBuffer);
		const pngSize = image.getDimensions();
		if (pngSize.width <= 0 || pngSize.height <= 0) {
			throw new ActionableError("Screenshot is invalid. Please try again.");
		}

		let processedBuffer = screenshotBuffer;
		let mimeType = "image/png";

		if (isImageMagickInstalled()) {
			trace("ImageMagick is installed, resizing screenshot");
			const imageProcessor = Image.fromBuffer(screenshotBuffer);
			const beforeSize = screenshotBuffer.length;

			if (screenSize.scale === 0) {
				throw new ActionableError("Screen size scale cannot be zero. Please check your configuration.");
			}
			processedBuffer = imageProcessor
				.resize(Math.floor(pngSize.width / screenSize.scale))
				.jpeg({ quality: 75 })
				.toBuffer();

			const afterSize = processedBuffer.length;
			trace(`Screenshot resized from ${beforeSize} bytes to ${afterSize} bytes`);
			mimeType = "image/jpeg";
		}

		return { buffer: processedBuffer, mimeType };
	}

	public static generateUniqueFilename(outputDir: string, mimeType: string): string {
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const extension = mimeType === "image/jpeg" ? "jpg" : "png";
		let filename = `screenshot-${timestamp}.${extension}`;
		let filepath = path.join(outputDir, filename);

		let counter = 1;
		while (existsSync(filepath)) {
			filename = `screenshot-${timestamp}-${counter}.${extension}`;
			filepath = path.join(outputDir, filename);
			counter++;
		}

		return filepath;
	}

	public static saveScreenshot(
		screenshotBuffer: Buffer,
		outputDir: string,
		mimeType: string
	): string {
		if (!path.isAbsolute(outputDir)) {
			throw new ActionableError("output_dir must be an absolute path");
		}

		if (!existsSync(outputDir)) {
			throw new ActionableError(`Output directory does not exist: ${outputDir}`);
		}

		const filepath = this.generateUniqueFilename(outputDir, mimeType);
		writeFileSync(filepath, screenshotBuffer);
		trace(`Screenshot saved to: ${filepath}`);

		return filepath;
	}
}

export class AudioManager {
	private outputDir: string;

	constructor(outputDir: string = path.join(os.tmpdir(), "mobile-mcp-audio")) {
		this.outputDir = outputDir;
	}

	async processAudioFile(audioData: Buffer, devicePath: string): Promise<string> {
		await this.ensureOutputDir();
		const filename = this.generateFilename(devicePath);
		const outputPath = path.join(this.outputDir, filename);

		await fs.writeFile(outputPath, audioData);
		return outputPath;
	}

	private generateFilename(devicePath: string): string {
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const extension = path.extname(devicePath) || ".m4a";
		return `audio-${timestamp}${extension}`;
	}

	private async ensureOutputDir(): Promise<void> {
		try {
			await fs.access(this.outputDir);
		} catch {
			await fs.mkdir(this.outputDir, { recursive: true });
		}
	}
}
