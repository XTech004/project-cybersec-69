import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PermissionsService, RoleDetail } from './permissions.service';

@ApiTags('Roles & Permissions (Strapi RBAC)')
@Controller()
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get('api/users-permissions/roles')
  @ApiOperation({ summary: 'ดูรายชื่อบทบาททั้งหมด (Strapi format)' })
  @ApiOkResponse({ description: 'รายการ Role ทั้งหมด' })
  async getRoles() {
    const roles = this.permissionsService.getAllRoles();
    return { roles };
  }

  @Get('api/users-permissions/roles/:id')
  @ApiOperation({ summary: 'ดูการกำหนดสิทธิ์ของบทบาทโดยละเอียด (Permissions matrix)' })
  @ApiOkResponse({ description: 'รายละเอียดสิทธิ์ของบทบาท' })
  async getRoleDetail(@Param('id') id: string) {
    const role = this.permissionsService.getRoleById(id);
    if (!role) {
      throw new NotFoundException(`ไม่พบบทบาทที่มีรหัส "${id}"`);
    }
    return { role };
  }

  @Put('api/users-permissions/roles/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'อัปเดตสิทธิ์ของบทบาท (เฉพาะ ADMIN)' })
  @ApiOkResponse({ description: 'บันทึกสิทธิ์สำเร็จ' })
  async updateRole(@Param('id') id: string, @Body() data: Partial<RoleDetail>) {
    const updated = this.permissionsService.updateRolePermissions(id, data);
    if (!updated) {
      throw new NotFoundException(`ไม่พบบทบาทที่มีรหัส "${id}"`);
    }
    return { ok: true, role: updated };
  }

  // --- Aliases for Strapi Admin Settings Paths ---

  @Get('admin/settings/users-permissions/roles')
  async getAdminSettingsRoles() {
    return this.getRoles();
  }

  @Get('admin/settings/users-permissions/roles/:id')
  async getAdminSettingsRoleDetail(@Param('id') id: string) {
    return this.getRoleDetail(id);
  }

  @Put('admin/settings/users-permissions/roles/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  async updateAdminSettingsRole(@Param('id') id: string, @Body() data: Partial<RoleDetail>) {
    return this.updateRole(id, data);
  }
}
