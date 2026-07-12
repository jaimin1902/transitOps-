// prisma/seed.ts
import { PrismaClient, Role, VehicleStatus, DriverStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  // Delete in reverse order of dependencies
  await prisma.rolePermission.deleteMany({});
  await prisma.settings.deleteMany({});
  await prisma.revenueEntry.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.notificationLog.deleteMany({});
  await prisma.vehicleDocument.deleteMany({});
  await prisma.fuelLog.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.maintenanceLog.deleteMany({});
  await prisma.trip.deleteMany({});
  await prisma.driver.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Seeding users...');
  const passwordHash = bcrypt.hashSync('Password123', 10);

  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@transitops.com',
      name: 'John Manager',
      passwordHash,
      role: Role.FLEET_MANAGER,
    },
  });

  const driverUser = await prisma.user.create({
    data: {
      email: 'driver@transitops.com',
      name: 'David Dispatcher',
      passwordHash,
      role: Role.DISPATCHER,
    },
  });

  const safetyUser = await prisma.user.create({
    data: {
      email: 'safety@transitops.com',
      name: 'Sarah Safety',
      passwordHash,
      role: Role.SAFETY_OFFICER,
    },
  });

  const financeUser = await prisma.user.create({
    data: {
      email: 'finance@transitops.com',
      name: 'Fiona Finance',
      passwordHash,
      role: Role.FINANCIAL_ANALYST,
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@transitops.com',
      name: 'Alex Admin',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  console.log('Seeding drivers...');
  const driver = await prisma.driver.create({
    data: {
      userId: driverUser.id,
      name: 'David Driver',
      licenseNumber: 'DL-9988776655',
      licenseCategory: 'Heavy Commercial',
      licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      contactNumber: '+1-555-0199',
      safetyScore: 95,
      status: DriverStatus.AVAILABLE,
    },
  });

  // Seed another driver who has expired license for validation tests
  const expiredDriver = await prisma.driver.create({
    data: {
      name: 'Edward Expired',
      licenseNumber: 'DL-1122334455',
      licenseCategory: 'Light Commercial',
      licenseExpiryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Expired 5 days ago
      contactNumber: '+1-555-0122',
      safetyScore: 82,
      status: DriverStatus.AVAILABLE,
    },
  });

  // Seed a suspended driver
  const suspendedDriver = await prisma.driver.create({
    data: {
      name: 'Sam Suspended',
      licenseNumber: 'DL-5544332211',
      licenseCategory: 'Heavy Commercial',
      licenseExpiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      contactNumber: '+1-555-0155',
      safetyScore: 60,
      status: DriverStatus.SUSPENDED,
    },
  });

  console.log('Seeding vehicles...');
  const vehicle1 = await prisma.vehicle.create({
    data: {
      registrationNumber: 'MH-12-PQ-1234',
      name: 'Volvo FH16 Cargo Truck',
      type: 'Heavy Truck',
      maxLoadCapacity: 25000, // 25 tons
      odometer: 12500,
      acquisitionCost: 150000,
      status: VehicleStatus.AVAILABLE,
      region: 'North',
    },
  });

  const vehicle2 = await prisma.vehicle.create({
    data: {
      registrationNumber: 'MH-12-PQ-5678',
      name: 'Scania R500 Delivery Van',
      type: 'Light Truck',
      maxLoadCapacity: 8000, // 8 tons
      odometer: 45000,
      acquisitionCost: 75000,
      status: VehicleStatus.IN_SHOP,
      region: 'South',
    },
  });

  const vehicle3 = await prisma.vehicle.create({
    data: {
      registrationNumber: 'MH-12-PQ-9012',
      name: 'Tata Ultra Flatbed',
      type: 'Flatbed',
      maxLoadCapacity: 15000,
      odometer: 8500,
      acquisitionCost: 95000,
      status: VehicleStatus.AVAILABLE,
      region: 'West',
    },
  });

  console.log('Seeding maintenance logs...');
  await prisma.maintenanceLog.create({
    data: {
      vehicleId: vehicle2.id,
      type: 'Engine Service',
      description: 'Scheduled major engine checkup and filter replacements.',
      cost: 1200,
      status: 'ACTIVE',
      startDate: new Date(),
    },
  });

  console.log('Seeding fuel logs & expenses...');
  await prisma.fuelLog.create({
    data: {
      vehicleId: vehicle1.id,
      liters: 150,
      cost: 220,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.expense.create({
    data: {
      vehicleId: vehicle1.id,
      type: 'TOLL',
      amount: 45,
      description: 'Highway 101 toll tax',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('Seeding monthly revenue entries...');
  const months = [
    { date: new Date('2026-01-01T00:00:00Z'), amount1: 800, amount2: 700 },
    { date: new Date('2026-02-01T00:00:00Z'), amount1: 1200, amount2: 1000 },
    { date: new Date('2026-03-01T00:00:00Z'), amount1: 1000, amount2: 900 },
    { date: new Date('2026-04-01T00:00:00Z'), amount1: 1500, amount2: 1300 },
    { date: new Date('2026-05-01T00:00:00Z'), amount1: 1300, amount2: 1200 },
    { date: new Date('2026-06-01T00:00:00Z'), amount1: 2000, amount2: 1600 },
    { date: new Date('2026-07-01T00:00:00Z'), amount1: 1700, amount2: 1400 },
  ];

  for (const m of months) {
    await prisma.revenueEntry.create({
      data: {
        vehicleId: vehicle1.id,
        month: m.date,
        amount: m.amount1,
      },
    });
    await prisma.revenueEntry.create({
      data: {
        vehicleId: vehicle2.id,
        month: m.date,
        amount: m.amount2,
      },
    });
  }

  console.log('Seeding settings...');
  await prisma.settings.create({
    data: {
      depotName: 'TransitOps Depot',
      currency: 'USD',
      distanceUnit: 'km',
    },
  });

  console.log('Seeding role permissions...');
  const defaultPermissions = [
    // ADMIN
    { role: Role.ADMIN, module: 'fleet', access: 'edit' },
    { role: Role.ADMIN, module: 'drivers', access: 'edit' },
    { role: Role.ADMIN, module: 'trips', access: 'edit' },
    { role: Role.ADMIN, module: 'maintenance', access: 'edit' },
    { role: Role.ADMIN, module: 'fuel_expenses', access: 'edit' },
    { role: Role.ADMIN, module: 'analytics', access: 'edit' },
    { role: Role.ADMIN, module: 'compliance', access: 'edit' },
    { role: Role.ADMIN, module: 'settings', access: 'edit' },

    // FLEET_MANAGER
    { role: Role.FLEET_MANAGER, module: 'fleet', access: 'edit' },
    { role: Role.FLEET_MANAGER, module: 'drivers', access: 'edit' },
    { role: Role.FLEET_MANAGER, module: 'trips', access: 'edit' },
    { role: Role.FLEET_MANAGER, module: 'maintenance', access: 'edit' },
    { role: Role.FLEET_MANAGER, module: 'fuel_expenses', access: 'edit' },
    { role: Role.FLEET_MANAGER, module: 'analytics', access: 'edit' },
    { role: Role.FLEET_MANAGER, module: 'compliance', access: 'edit' },
    { role: Role.FLEET_MANAGER, module: 'settings', access: 'edit' },

    // DISPATCHER
    { role: Role.DISPATCHER, module: 'fleet', access: 'view' },
    { role: Role.DISPATCHER, module: 'drivers', access: 'none' },
    { role: Role.DISPATCHER, module: 'trips', access: 'edit' },
    { role: Role.DISPATCHER, module: 'maintenance', access: 'none' },
    { role: Role.DISPATCHER, module: 'fuel_expenses', access: 'edit' },
    { role: Role.DISPATCHER, module: 'analytics', access: 'none' },
    { role: Role.DISPATCHER, module: 'compliance', access: 'none' },
    { role: Role.DISPATCHER, module: 'settings', access: 'none' },

    // SAFETY_OFFICER
    { role: Role.SAFETY_OFFICER, module: 'fleet', access: 'view' },
    { role: Role.SAFETY_OFFICER, module: 'drivers', access: 'edit' },
    { role: Role.SAFETY_OFFICER, module: 'trips', access: 'view' },
    { role: Role.SAFETY_OFFICER, module: 'maintenance', access: 'view' },
    { role: Role.SAFETY_OFFICER, module: 'fuel_expenses', access: 'none' },
    { role: Role.SAFETY_OFFICER, module: 'analytics', access: 'view' },
    { role: Role.SAFETY_OFFICER, module: 'compliance', access: 'edit' },
    { role: Role.SAFETY_OFFICER, module: 'settings', access: 'none' },

    // FINANCIAL_ANALYST
    { role: Role.FINANCIAL_ANALYST, module: 'fleet', access: 'view' },
    { role: Role.FINANCIAL_ANALYST, module: 'drivers', access: 'view' },
    { role: Role.FINANCIAL_ANALYST, module: 'trips', access: 'view' },
    { role: Role.FINANCIAL_ANALYST, module: 'maintenance', access: 'view' },
    { role: Role.FINANCIAL_ANALYST, module: 'fuel_expenses', access: 'edit' },
    { role: Role.FINANCIAL_ANALYST, module: 'analytics', access: 'edit' },
    { role: Role.FINANCIAL_ANALYST, module: 'compliance', access: 'none' },
    { role: Role.FINANCIAL_ANALYST, module: 'settings', access: 'none' },
  ];

  for (const perm of defaultPermissions) {
    await prisma.rolePermission.create({
      data: perm,
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
