import { PrismaClient, Role, Priority, TicketStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for IT Service Desk...');

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // 1. Seed Users
  console.log('👤 Seeding Users...');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@servicedesk.local' },
    update: {},
    create: {
      email: 'admin@servicedesk.local',
      password: hashedPassword,
      firstName: 'Sorasak',
      lastName: 'Administrator',
      role: Role.ADMIN,
      department: 'IT Security',
    },
  });

  const itSupport = await prisma.user.upsert({
    where: { email: 'support@servicedesk.local' },
    update: {},
    create: {
      email: 'support@servicedesk.local',
      password: hashedPassword,
      firstName: 'Somchai',
      lastName: 'TechSupport',
      role: Role.IT_SUPPORT,
      department: 'IT Operations',
    },
  });

  const employee1 = await prisma.user.upsert({
    where: { email: 'employee1@servicedesk.local' },
    update: {},
    create: {
      email: 'employee1@servicedesk.local',
      password: hashedPassword,
      firstName: 'Wichai',
      lastName: 'Accountant',
      role: Role.EMPLOYEE,
      department: 'Finance',
    },
  });

  const employee2 = await prisma.user.upsert({
    where: { email: 'employee2@servicedesk.local' },
    update: {},
    create: {
      email: 'employee2@servicedesk.local',
      password: hashedPassword,
      firstName: 'Suda',
      lastName: 'HRStaff',
      role: Role.EMPLOYEE,
      department: 'Human Resources',
    },
  });

  // 2. Seed Categories
  console.log('📁 Seeding Categories...');
  const catHardware = await prisma.category.upsert({
    where: { name: 'Hardware' },
    update: {},
    create: {
      name: 'Hardware',
      description: 'ปัญหาคอมพิวเตอร์ จอภาพ เมาส์ คีย์บอร์ด ปริ้นเตอร์ และอุปกรณ์ต่อพ่วง',
    },
  });

  const catSoftware = await prisma.category.upsert({
    where: { name: 'Software' },
    update: {},
    create: {
      name: 'Software',
      description: 'โปรแกรมค้าง ติดตั้งโปรแกรม อัปเดตระบบปฏิบัติการ License ซอฟต์แวร์',
    },
  });

  const catNetwork = await prisma.category.upsert({
    where: { name: 'Network' },
    update: {},
    create: {
      name: 'Network',
      description: 'อินเทอร์เน็ตหลุด WiFi ใช้งานไม่ได้ ปัญหาเชื่อมต่อ VPN และระบบเครือข่าย',
    },
  });

  const catSecurity = await prisma.category.upsert({
    where: { name: 'Security Incident' },
    update: {},
    create: {
      name: 'Security Incident',
      description: 'แจ้งเตือนอีเมลฟิชชิ่ง สงสัยว่าเครื่องติดไวรัสหรือข้อมูลรั่วไหล',
    },
  });

  const catAccess = await prisma.category.upsert({
    where: { name: 'System Access' },
    update: {},
    create: {
      name: 'System Access',
      description: 'ขอสิทธิ์เข้าใช้งานโฟลเดอร์ส่วนกลาง รีเซ็ตรหัสผ่าน และเปิดบัญชีผู้ใช้ใหม่',
    },
  });

  // 3. Seed Sample Tickets
  console.log('🎫 Seeding Sample Tickets...');
  const ticket1 = await prisma.ticket.create({
    data: {
      title: 'จอคอมพิวเตอร์เปิดไม่ติด มีไฟสีส้มกระพริบ',
      description: 'ใช้งานอยู่ดีๆ จอดับไป ลองขยับสาย HDMI ด้านหลังแล้วยังไม่ติด แผนกการเงิน ชั้น 3 โต๊ะ 12',
      priority: Priority.HIGH,
      status: TicketStatus.OPEN,
      createdById: employee1.id,
      categoryId: catHardware.id,
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      title: 'ต้องการติดตั้งโปรแกรม Adobe Acrobat Pro สำหรับงานจัดเตรียมเอกสารสัญญา',
      description: 'ขอความอนุเคราะห์ติดตั้งลิขสิทธิ์ Adobe Acrobat สำหรับเซ็นเอกสารดิจิทัล แผนก HR',
      priority: Priority.MEDIUM,
      status: TicketStatus.IN_PROGRESS,
      createdById: employee2.id,
      assignedToId: itSupport.id,
      categoryId: catSoftware.id,
      comments: {
        create: [
          {
            content: 'ได้รับคำขอแล้วครับ กำลังเตรียมจัดสรร License และจะรีโมทเข้าไปติดตั้งให้ช่วงบ่าย 14:00 น.',
            authorId: itSupport.id,
            isInternal: false,
          },
        ],
      },
    },
  });

  const ticket3 = await prisma.ticket.create({
    data: {
      title: 'ได้รับอีเมลน่าสงสัยแจ้งเรื่องการตัดเงินบัญชีองค์กร',
      description: 'มีอีเมลส่งมาจาก billing@external-fake.com ให้กดลิงก์ยืนยันตัวตน สงสัยว่าเป็น Phishing Mail',
      priority: Priority.CRITICAL,
      status: TicketStatus.RESOLVED,
      createdById: employee1.id,
      assignedToId: admin.id,
      categoryId: catSecurity.id,
      comments: {
        create: [
          {
            content: 'ทีม IT Security ได้ทำการบล็อกโดเมนและลบอีเมลดังกล่าวออกจากระบบ Mail Server เรียบร้อยแล้วครับ ขอบคุณที่แจ้งเตือน',
            authorId: admin.id,
            isInternal: false,
          },
        ],
      },
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log(`- Created Users: ${admin.email}, ${itSupport.email}, ${employee1.email}, ${employee2.email}`);
  console.log(`- Created 5 Categories`);
  console.log(`- Created 3 Sample Tickets`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
