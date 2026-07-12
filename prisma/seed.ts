// prisma/seed.ts
import { PrismaClient, Role, VehicleStatus, DriverStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  // Delete in reverse order of dependencies
  await prisma.auditLog.deleteMany({});
  await prisma.notificationLog.deleteMany({});
  await prisma.vehicleDocument.deleteMany({});
  await prisma.fuelLog.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.maintenanceLog.deleteMany({});
  await prisma.trip.deleteMany({});
  await prisma.driver.deleteMany({});
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
      name: 'David Driver',
      passwordHash,
      role: Role.DRIVER,
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
      status: 'OPEN',
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
