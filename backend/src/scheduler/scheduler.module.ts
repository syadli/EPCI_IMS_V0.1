import { Module } from '@nestjs/common';
import { SlaScheduler } from './sla.scheduler';
import { MailModule } from '../mail/mail.module'; // Butuh MailModule untuk kirim email

@Module({
    imports: [MailModule],
    providers: [SlaScheduler],
})
export class SchedulerModule { }