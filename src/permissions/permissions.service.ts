import { Injectable } from '@nestjs/common';

export interface ActionPermissions {
  create: boolean;
  delete: boolean;
  find: boolean;
  findOne: boolean;
  update: boolean;
}

export interface ControllerPermissions {
  category: ActionPermissions;
  ticket: ActionPermissions;
  'ticket-comment': ActionPermissions;
  department: ActionPermissions;
  user: ActionPermissions;
}

export interface RoleDetail {
  id: string;
  name: string;
  description: string;
  type: string;
  nb_users?: number;
  permissions: ControllerPermissions;
}

@Injectable()
export class PermissionsService {
  private roles: Map<string, RoleDetail> = new Map();

  constructor() {
    this.initializeDefaultRoles();
  }

  private initializeDefaultRoles() {
    // 1. ADMIN (Super Admin)
    this.roles.set('admin', {
      id: 'admin',
      name: 'Admin',
      description: 'Super administrator with full system permissions.',
      type: 'admin',
      nb_users: 1,
      permissions: {
        category: { create: true, delete: true, find: true, findOne: true, update: true },
        ticket: { create: true, delete: true, find: true, findOne: true, update: true },
        'ticket-comment': { create: true, delete: true, find: true, findOne: true, update: true },
        department: { create: true, delete: true, find: true, findOne: true, update: true },
        user: { create: true, delete: true, find: true, findOne: true, update: true },
      },
    });

    // 2. IT_SUPPORT
    this.roles.set('it_support', {
      id: 'it_support',
      name: 'IT Support',
      description: 'IT Staff managing incidents, categories and user requests.',
      type: 'it_support',
      nb_users: 1,
      permissions: {
        category: { create: true, delete: false, find: true, findOne: true, update: true },
        ticket: { create: true, delete: false, find: true, findOne: true, update: true },
        'ticket-comment': { create: true, delete: true, find: true, findOne: true, update: true },
        department: { create: true, delete: false, find: true, findOne: true, update: true },
        user: { create: false, delete: false, find: true, findOne: true, update: false },
      },
    });

    // 3. EMPLOYEE / Authenticated
    this.roles.set('authenticated', {
      id: 'authenticated',
      name: 'Authenticated',
      description: 'Default role given to authenticated user.',
      type: 'authenticated',
      nb_users: 3,
      permissions: {
        category: { create: false, delete: false, find: true, findOne: true, update: false },
        ticket: { create: true, delete: false, find: true, findOne: true, update: true },
        'ticket-comment': { create: true, delete: false, find: true, findOne: true, update: false },
        department: { create: false, delete: false, find: true, findOne: true, update: false },
        user: { create: false, delete: false, find: true, findOne: true, update: false },
      },
    });

    // 4. Public (matches Strapi Image 2)
    this.roles.set('public', {
      id: 'public',
      name: 'Public',
      description: 'Default role given to unauthenticated user.',
      type: 'public',
      nb_users: 0,
      permissions: {
        category: { create: false, delete: false, find: true, findOne: true, update: false },
        ticket: { create: false, delete: false, find: false, findOne: false, update: false },
        'ticket-comment': { create: false, delete: false, find: false, findOne: false, update: false },
        department: { create: false, delete: false, find: false, findOne: false, update: false },
        user: { create: false, delete: false, find: false, findOne: false, update: false },
      },
    });
  }

  getAllRoles() {
    return Array.from(this.roles.values()).map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      type: r.type,
      nb_users: r.nb_users,
    }));
  }

  getRoleById(roleId: string): RoleDetail | undefined {
    const key = this.normalizeRoleKey(roleId);
    return this.roles.get(key);
  }

  updateRolePermissions(roleId: string, data: Partial<RoleDetail>) {
    const key = this.normalizeRoleKey(roleId);
    const existing = this.roles.get(key);
    if (!existing) {
      return null;
    }

    if (data.name) existing.name = data.name;
    if (data.description) existing.description = data.description;
    if (data.permissions) {
      existing.permissions = {
        ...existing.permissions,
        ...data.permissions,
      };
    }

    this.roles.set(key, existing);
    return existing;
  }

  hasPermission(roleName: string, controller: keyof ControllerPermissions, action: keyof ActionPermissions): boolean {
    const key = this.normalizeRoleKey(roleName);
    const role = this.roles.get(key);
    if (!role) return false;
    if (role.type === 'admin') return true; // Admin has master permission
    return !!role.permissions[controller]?.[action];
  }

  private normalizeRoleKey(role: string): string {
    const lower = role.toLowerCase().replace('-', '_');
    if (lower === 'employee' || lower === 'authenticated') return 'authenticated';
    if (lower === 'admin') return 'admin';
    if (lower === 'it_support' || lower === 'itsupport') return 'it_support';
    if (lower === 'public') return 'public';
    return lower;
  }
}
