import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import { randomUUID } from 'crypto';
import type { Express } from 'express';

@Injectable()
export class GcsService {
  private readonly storage: Storage;
  private readonly bucketName: string;
  private readonly logger = new Logger(GcsService.name);

  constructor(private configService: ConfigService) {
    const projectId = this.configService.get<string>('gcs.projectId');
    const keyFilePath = this.configService.get<string>('gcs.keyFilePath');
    this.bucketName = this.configService.get<string>('gcs.bucketName') || 'epci-ims-uploads-astral-pivot-369816';

    const storageOptions: any = {};
    if (projectId) {
      storageOptions.projectId = projectId;
    }
    if (keyFilePath) {
      storageOptions.keyFilename = keyFilePath;
    }

    this.storage = new Storage(storageOptions);
  }

  /**
   * Mengunggah file dari Multer ke GCS.
   * Mengembalikan 'gcsPath' unik untuk disimpan di database.
   */
  async uploadFile(file: Express.Multer.File, folder = 'attachments'): Promise<{ gcsPath: string }> {
    const bucket = this.storage.bucket(this.bucketName);
    
    // Bersihkan nama file
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-_]/g, '_');
    const gcsPath = `${folder}/${Date.now()}-${randomUUID()}-${safeName}`;
    const blob = bucket.file(gcsPath);

    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: file.mimetype,
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (err) => {
        this.logger.error(`Gagal mengunggah file ke GCS: ${err.message}`, err.stack);
        reject(err);
      });

      blobStream.on('finish', () => {
        // Mengembalikan path unik di bucket, bukan URL publik mentah
        resolve({ gcsPath });
      });

      blobStream.end(file.buffer);
    });
  }

  /**
   * Menghasilkan GCS Signed URL yang berlaku selama 30 menit (1800 detik)
   */
  async getSignedUrl(gcsPath: string): Promise<string> {
    // Menghindari pembuatan Signed URL untuk file lokal lama (jika ada data lama di DB)
    if (!gcsPath || gcsPath.startsWith('http') || gcsPath.startsWith('/uploads')) {
      return gcsPath;
    }

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(gcsPath);

      // Membuat URL yang ditandatangani
      const [signedUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 30 * 60 * 1000, // 30 menit dalam milidetik
      });

      return signedUrl;
    } catch (err) {
      this.logger.error(`Gagal membuat Signed URL untuk ${gcsPath}: ${err.message}`, err.stack);
      // Fallback jika gagal membuat signed URL
      return gcsPath;
    }
  }

  /**
   * Menghapus file dari GCS
   */
  async deleteFile(gcsPath: string): Promise<void> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(gcsPath);
      await file.delete();
    } catch (err) {
      this.logger.error(`Gagal menghapus file di GCS: ${err.message}`, err.stack);
    }
  }
}
