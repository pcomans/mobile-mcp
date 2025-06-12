import { tmpdir } from "os";
import { randomBytes } from "crypto";
import { readFileSync, unlinkSync } from "fs";
import path from "path";

export class TempFileManager {
	public static async withTempFile<T>(
		prefix: string,
		extension: string,
		operation: (filepath: string) => Promise<T>
	): Promise<T> {
		const filename = `${prefix}-${randomBytes(8).toString("hex")}.${extension}`;
		const filepath = path.join(tmpdir(), filename);

		try {
			const result = await operation(filepath);
			return result;
		} finally {
			try {
				unlinkSync(filepath);
			} catch (error) {
			}
		}
	}

	public static readTempFile(filepath: string): Buffer {
		return readFileSync(filepath);
	}
}
