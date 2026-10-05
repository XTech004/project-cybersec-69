import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
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
    return this.prisma.category.delete({ where: { id } });
  }
}