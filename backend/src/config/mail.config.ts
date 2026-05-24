import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT as string, 10) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || '"EPCI IMS System" <noreply@epci-ims.com>',
}));