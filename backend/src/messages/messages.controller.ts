import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('messages')
@UseGuards(AuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  getConversations(@Request() req: any) {
    return this.messagesService.findConversations(req.user.sub);
  }

  @Get('unread-count')
  getUnreadCount(@Request() req: any) {
    return this.messagesService.countUnread(req.user.sub);
  }

  @Post('mark-all-read')
  markAllRead(@Request() req: any) {
    return this.messagesService.markAllRead(req.user.sub);
  }

  @Get(':userId')
  getConversation(@Request() req: any, @Param('userId') otherUserId: string) {
    return this.messagesService.findConversation(req.user.sub, otherUserId);
  }

  @Post()
  sendMessage(@Request() req: any, @Body() body: { receiverId: string; content: string }) {
    return this.messagesService.send(req.user.sub, body.receiverId, body.content);
  }

  @Post(':userId/read')
  markAsRead(@Request() req: any, @Param('userId') senderId: string) {
    return this.messagesService.markAsRead(req.user.sub, senderId);
  }
}
