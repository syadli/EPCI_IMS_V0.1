import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    constructor(private readonly mailerService: MailerService) { }

    /**
     * Mengirim email notifikasi perubahan status alur kerja IR
     */
    async sendWorkflowAlert(to: string, irNumber: string, title: string, status: string, actorName: string) {
        try {
            await this.mailerService.sendMail({
                to,
                subject: `[EPCI IMS] Update Status ${irNumber}: ${status}`,
                html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2>Notifikasi Alur Kerja EPCI IMS</h2>
            <p>Halo,</p>
            <p>Terdapat perubahan status pada dokumen <strong>${irNumber}</strong> yang dilakukan oleh <strong>${actorName}</strong>.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="background-color: #f4f6f9;"><td style="padding: 10px; font-weight: bold;">Judul IR:</td><td style="padding: 10px;">${title}</td></tr>
              <tr><td style="padding: 10px; font-weight: bold;">Status Baru:</td><td style="padding: 10px; color: #0284c7; font-weight: bold;">${status}</td></tr>
            </table>
            <p>Silakan masuk ke sistem aplikasi untuk menindaklanjuti tugas Anda.</p>
            <br>
            <hr style="border: none; border-top: 1px solid #eee;" />
            <p style="font-size: 11px; color: #999;">Ini adalah email otomatis dari EPCI Interface Management System. Mohon tidak membalas email ini.</p>
          </div>
        `,
            });
            this.logger.log(`Email alert alur kerja berhasil dikirim ke ${to}`);
        } catch (error) {
            this.logger.error(`Gagal mengirim email alert ke ${to}: ${error.message}`, error.stack);
        }
    }

    /**
     * Mengirim email pengingat batas waktu SLA dari Scheduler
     */
    async sendSlaReminder(to: string, irNumber: string, title: string, remainingHours: number) {
        try {
            await this.mailerService.sendMail({
                to,
                subject: `[URGENT SLA ALERT] Pengingat Batas Waktu ${irNumber}`,
                html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333; border: 2px solid #dc2626;">
            <h2 style="color: #dc2626;">⚠️ Peringatan Batas Waktu (SLA)</h2>
            <p>Halo Manajer / Tim Teknis,</p>
            <p>Dokumen <strong>${irNumber}</strong> mendekati batas waktu penyelesaian (due date) yang telah disepakati.</p>
            <p>Sisa waktu pengerjaan: <strong style="color: #dc2626;">&lt; ${remainingHours} Jam</strong></p>
            <p><strong>Detail Proyek Dokumen:</strong> ${title}</p>
            <p>Mohon segera memberikan tanggapan teknis di aplikasi agar tidak mengganggu garis waktu proyek EPCI.</p>
            <br>
            <p>Salam,<br>Sistem Otomatis EPCI IMS</p>
          </div>
        `,
            });
            this.logger.log(`Email pengingat SLA berhasil dikirim ke ${to}`);
        } catch (error) {
            this.logger.error(`Gagal mengirim email pengingat SLA ke ${to}: ${error.message}`, error.stack);
        }
    }
}