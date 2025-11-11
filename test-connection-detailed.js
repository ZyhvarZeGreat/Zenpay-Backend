require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔌 Testing Database Connection...\n');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Connection Status: ACTIVE\n');
    
    // Get table count
    const tableCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log(`📊 Total Tables: ${tableCount[0].count}`);
    
    // Test queries
    const userCount = await prisma.user.count();
    const employeeCount = await prisma.employee.count();
    const paymentCount = await prisma.payment.count();
    
    console.log(`👥 Users: ${userCount}`);
    console.log(`💼 Employees: ${employeeCount}`);
    console.log(`💰 Payments: ${paymentCount}`);
    
    // Test database URL
    console.log('\n🔗 Database URL:', process.env.DATABASE_URL ? '✅ Configured' : '❌ Not found');
    if (process.env.DATABASE_URL) {
      const url = process.env.DATABASE_URL;
      const masked = url.replace(/:[^:@]+@/, ':****@');
      console.log('   ', masked.substring(0, 80) + '...');
    }
    
    console.log('\n✅ Database is fully operational!');
    
  } catch (error) {
    console.error('\n❌ Connection Test Failed!');
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

