import { registerAs } from '@nestjs/config';

export default registerAs('gcs', () => ({
  projectId: process.env.GCS_PROJECT_ID,
  keyFilePath: process.env.GCS_KEY_FILE_PATH,
  bucketName: process.env.GCS_BUCKET_NAME || 'epci-ims-uploads-astral-pivot-369816',
}));
