import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { name: string; description?: string }) {
    try {
      return await this.prisma.category.create({ data });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('ชื่อหมวดหมู่นี้มีอยู่แล้ว');
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { tickets: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { tickets: true },
        },
      },
    });
    if (!category) {
      throw new NotFoundException('ไม่พบหมวดหมู่');
    }
    return category;
  }

  async update(id: string, data: { name?: string; description?: string }) {
    await this.findOne(id);
    try {
      return await this.prisma.category.update({ where: { id }, data });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('ชื่อหมวดหมู่นี้มีอยู่แล้ว');
      }
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    const ticketCount = await this.prisma.ticket.count({ where: { categoryId: id } });
    if (ticketCount > 0) {
      throw new BadRequestException(`ไม่สามารถลบหมวดหมู่นี้ได้เนื่องจากมีตั๋วแจ้งซ่อมใช้งานอยู่ (${ticketCount} ใบ)`);
    }
    return this.prisma.category.delete({ where: { id } });
  }
}