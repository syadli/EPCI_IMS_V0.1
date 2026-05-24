import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { IRStatus } from '@prisma/client';

@Injectable()
export class SlaScheduler {
    private readonly logger = new Logger(SlaScheduler.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly mailService: MailService,
    ) { }

    //**
    // * Cron Job otomatis yang berjalan SETIAP HARI JAM 08:00 PAGI.
    // * Anda bisa mengubahnya ke '*/5 * * * *' jika ingin mengetesnya berjalan setiap 5 menit.
    // *
    @Cron('*/10 * * * *')
    async handleSlaCheck() {
        this.logger.log('Memulai pemindaian otomatis batas waktu (SLA) untuk dokumen IR...');

        const sekarang = new Date();
        // Menghitung batas waktu 48 jam dari sekarang
        const batas48Jam = new Date(sekarang.getTime() + 48 * 60 * 60 * 1000);

        try {
            // 1. Ambil dokumen IR yang berstatus AKTIF (bukan draft dan belum closed)
            // serta memiliki dueDate yang kurang dari atau sama dengan batas 48 jam ke depan.
            const irMendekatiSla = await this.prisma.interfaceRequest.findMany({
                where: {
                    NOT: {
                        status: {
                            in: [IRStatus.draft, IRStatus.closed] as any, // Sesuaikan nama enum status di schema.prisma Anda
                        },
                    },
                    dueDate: {
                        gt: sekarang,      // Belum terlewat (masih masa tenggat)
                        lte: batas48Jam,   // Kurang dari atau sama dengan 48 jam dari sekarang
                    },
                },
                include: {
                    assignedUser: true, // Sertakan data user yang bertanggung jawab saat ini
                },
            });

            if (irMendekatiSla.length === 0) {
                this.logger.log('Aman. Tidak ada dokumen IR yang mendekati batas waktu SLA 48 jam.');
                return;
            }

            this.logger.warn(`Ditemukan ${irMendekatiSla.length} dokumen IR mendekati batas waktu! Memproses email pengingat...`);

            // 2. Iterasi setiap dokumen dan kirim email pengingat ke penanggung jawab (Assigned User)
            for (const ir of irMendekatiSla) {
                if (ir.assignedUser && ir.assignedUser.email) {
                    // Menghitung sisa jam secara riil untuk diinformasikan di email
                    const sisaWaktuMilidetik = ir.dueDate.getTime() - sekarang.getTime();
                    const sisaJam = Math.round(sisaWaktuMilidetik / (1000 * 60 * 60));

                    await this.mailService.sendSlaReminder(
                        ir.assignedUser.email,
                        ir.irNumber,
                        ir.title,
                        sisaJam
                    );
                } else {
                    this.logger.warn(`Dokumen ${ir.irNumber} mendekati SLA tetapi tidak memiliki Person In Charge (assignedUser) atau email kosong.`);
                }
            }

            this.logger.log('Seluruh email pengingat eskalasi SLA berhasil diproses.');
        } catch (error) {
            this.logger.error(`Terjadi error saat menjalankan SLA Scheduler: ${error.message}`, error.stack);
        }
    }
}