import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Message } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private realtimeGateway: RealtimeGateway,
  ) {}

  async send(senderId: string, receiverId: string, content: string): Promise<Message> {
    const message = await this.prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
      },
    });

    await this.notificationsService.create({
      userId: receiverId,
      title: 'New direct message',
      message: `Message from ${senderId}: ${content}`,
      type: 'message',
      link: '/messages',
    });

    this.realtimeGateway.notifyUser(receiverId, 'message:new', message);
    return message;
  }

  async findConversation(user1Id: string, user2Id: string): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: user1Id, receiverId: user2Id },
          { senderId: user2Id, receiverId: user1Id },
        ],
      },
      orderBy: { timestamp: 'asc' },
    });
  }

  async findConversations(userId: string) {
    // Get unique users that the user has chatted with
    const sent = await this.prisma.message.findMany({
      where: { senderId: userId },
      select: { receiver: true },
      distinct: ['receiverId'],
    });
    const received = await this.prisma.message.findMany({
      where: { receiverId: userId },
      select: { sender: true },
      distinct: ['senderId'],
    });

    const users = new Map();
    sent.forEach((m: any) => users.set(m.receiver.id, m.receiver));
    received.forEach((m: any) => users.set(m.sender.id, m.sender));
    
    return Array.from(users.values());
  }

  async markAsRead(receiverId: string, senderId: string) {
    return this.prisma.message.updateMany({
      where: {
        receiverId,
        senderId,
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  async countUnread(receiverId: string): Promise<number> {
    return this.prisma.message.count({
      where: {
        receiverId,
        isRead: false,
      },
    });
  }

  async markAllRead(receiverId: string) {
    return this.prisma.message.updateMany({
      where: { receiverId, isRead: false },
      data: { isRead: true },
    });
  }
}
