import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Priority, TicketStatus, Role } from '@prisma/client';

interface CreateTicketDto {
  title: string;
  description: string;
  priority?: Priority;
  categoryId: string;
}

interface UpdateTicketDto {
  title?: string;
  description?: string;
  priority?: Priority;
  status?: TicketStatus;
  categoryId?: string;
  assignedToId?: string;
}

@Injectable()
export class TicketService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: CreateTicketDto) {
    return this.prisma.ticket.create({
      data: {
        ...data,
        createdById: userId,
      },
      include: {
        category: true,
        createdBy: true,
        assignedTo: true,
      },
    });
  }

  async findAll(userId: string, role: Role) {
    if (role === Role.ADMIN || role === Role.IT_SUPPORT) {
      return this.prisma.ticket.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          createdBy: true,
          assignedTo: true,
          comments: {
            include: { author: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    }
    return this.prisma.ticket.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        createdBy: true,
        assignedTo: true,
        comments: {
          where: { isInternal: false },
          include: { author: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findOne(id: string, userId: string, role: Role) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        category: true,
        createdBy: true,
        assignedTo: true,
        comments: {
          include: { author: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('ไม่พบตั๋ว');
    }

    if (role === Role.EMPLOYEE && ticket.createdById !== userId && ticket.assignedToId !== userId) {
      throw new ForbiddenException('คุณไม่มีสิทธิ์เข้าถึงตั๋วนี้');
    }

    return ticket;
  }

  async update(id: string, userId: string, role: Role, data: UpdateTicketDto) {
    const ticket = await this.findOne(id, userId, role);

    if (role === Role.EMPLOYEE) {
      if (ticket.createdById !== userId) {
        throw new ForbiddenException('คุณสามารถแก้ไขได้เฉพาะตั๋วที่คุณสร้างเท่านั้น');
      }
      if (data.status || data.assignedToId) {
        throw new ForbiddenException('คุณไม่มีสิทธิ์เปลี่ยนสถานะหรือมอบหมายตั๋ว');
      }
    }

    return this.prisma.ticket.update({
      where: { id },
      data,
      include: {
        category: true,
        createdBy: true,
        assignedTo: true,
      },
    });
  }

  async remove(id: string, userId: string, role: Role) {
    const ticket = await this.findOne(id, userId, role);

    if (role === Role.EMPLOYEE && ticket.createdById !== userId) {
      throw new ForbiddenException('คุณสามารถลบได้เฉพาะตั๋วที่คุณสร้างเท่านั้น');
    }

    return this.prisma.ticket.delete({ where: { id } });
  }

  async addComment(ticketId: string, userId: string, content: string, isInternal: boolean = false) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException('ไม่พบตั๋ว');
    }

    return this.prisma.comment.create({
      data: {
        content,
        isInternal,
        ticketId,
        authorId: userId,
      },
      include: { author: true },
    });
  }

  async removeComment(commentId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      throw new NotFoundException('ไม่พบความคิดเห็น');
    }
    return this.prisma.comment.delete({ where: { id: commentId } });
  }
}