import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiForbiddenResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Role, Priority, TicketStatus } from '@prisma/client';
import { TicketService } from './ticket.service';

@ApiTags('Tickets')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post()
  @Roles(Role.ADMIN, Role.IT_SUPPORT, Role.EMPLOYEE)
  @ApiOperation({ summary: 'สร้างตั๋วใหม่' })
  @ApiCreatedResponse({ description: 'สร้างตั๋วสำเร็จ' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() data: { title: string; description: string; priority?: Priority; categoryId: string },
  ) {
    return this.ticketService.create(userId, data);
  }

  @Get()
  @Roles(Role.ADMIN, Role.IT_SUPPORT, Role.EMPLOYEE)
  @ApiOperation({ summary: 'ดูรายการตั๋วทั้งหมด' })
  @ApiOkResponse({ description: 'รายการตั๋ว' })
  @ApiQuery({ name: 'status', required: false, enum: TicketStatus })
  @ApiQuery({ name: 'priority', required: false, enum: Priority })
  async findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Query('status') status?: TicketStatus,
    @Query('priority') priority?: Priority,
  ) {
    return this.ticketService.findAll(userId, role);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.IT_SUPPORT, Role.EMPLOYEE)
  @ApiOperation({ summary: 'ดูรายละเอียดตั๋ว' })
  @ApiOkResponse({ description: 'รายละเอียดตั๋วพร้อมความคิดเห็น' })
  @ApiNotFoundResponse({ description: 'ไม่พบตั๋ว' })
  @ApiForbiddenResponse({ description: 'ไม่มีสิทธิ์เข้าถึงตั๋วนี้' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.ticketService.findOne(id, userId, role);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.IT_SUPPORT, Role.EMPLOYEE)
  @ApiOperation({ summary: 'แก้ไขตั๋ว' })
  @ApiOkResponse({ description: 'แก้ไขตั๋วสำเร็จ' })
  @ApiNotFoundResponse({ description: 'ไม่พบตั๋ว' })
  @ApiForbiddenResponse({ description: 'ไม่มีสิทธิ์แก้ไขตั๋วนี้' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Body() data: { title?: string; description?: string; priority?: Priority; status?: TicketStatus; categoryId?: string; assignedToId?: string },
  ) {
    return this.ticketService.update(id, userId, role, data);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.IT_SUPPORT, Role.EMPLOYEE)
  @ApiOperation({ summary: 'ลบตั๋ว' })
  @ApiOkResponse({ description: 'ลบตั๋วสำเร็จ' })
  @ApiNotFoundResponse({ description: 'ไม่พบตั๋ว' })
  @ApiForbiddenResponse({ description: 'ไม่มีสิทธิ์ลบตั๋วนี้' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.ticketService.remove(id, userId, role);
  }

  @Post(':id/comments')
  @Roles(Role.ADMIN, Role.IT_SUPPORT, Role.EMPLOYEE)
  @ApiOperation({ summary: 'เพิ่มความคิดเห็นในตั๋ว' })
  @ApiCreatedResponse({ description: 'เพิ่มความคิดเห็นสำเร็จ' })
  @ApiNotFoundResponse({ description: 'ไม่พบตั๋ว' })
  async addComment(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() data: { content: string; isInternal?: boolean },
  ) {
    return this.ticketService.addComment(id, userId, data.content, data.isInternal);
  }
}