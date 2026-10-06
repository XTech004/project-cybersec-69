import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiConflictResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CategoryService } from './category.service';

@ApiTags('Categories')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @Roles(Role.ADMIN, Role.IT_SUPPORT)
  @ApiOperation({ summary: 'สร้างหมวดหมู่ใหม่' })
  @ApiCreatedResponse({ description: 'สร้างหมวดหมู่สำเร็จ' })
  @ApiConflictResponse({ description: 'ชื่อหมวดหมู่นี้มีอยู่แล้ว' })
  async create(@Body() data: { name: string; description?: string }) {
    return this.categoryService.create(data);
  }

  @Get()
  @Roles(Role.ADMIN, Role.IT_SUPPORT, Role.EMPLOYEE)
  @ApiOperation({ summary: 'ดูรายการหมวดหมู่ทั้งหมด' })
  @ApiOkResponse({ description: 'รายการหมวดหมู่' })
  async findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.IT_SUPPORT, Role.EMPLOYEE)
  @ApiOperation({ summary: 'ดูรายละเอียดหมวดหมู่' })
  @ApiOkResponse({ description: 'รายละเอียดหมวดหมู่' })
  @ApiNotFoundResponse({ description: 'ไม่พบหมวดหมู่' })
  async findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.IT_SUPPORT)
  @ApiOperation({ summary: 'แก้ไขหมวดหมู่' })
  @ApiOkResponse({ description: 'แก้ไขหมวดหมู่สำเร็จ' })
  @ApiNotFoundResponse({ description: 'ไม่พบหมวดหมู่' })
  @ApiConflictResponse({ description: 'ชื่อหมวดหมู่นี้มีอยู่แล้ว' })
  async update(@Param('id') id: string, @Body() data: { name?: string; description?: string }) {
    return this.categoryService.update(id, data);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'ลบหมวดหมู่' })
  @ApiOkResponse({ description: 'ลบหมวดหมู่สำเร็จ' })
  @ApiNotFoundResponse({ description: 'ไม่พบหมวดหมู่' })
  async remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }
}