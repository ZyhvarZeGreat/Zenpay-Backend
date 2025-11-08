/**
 * Test DigitalOcean PostgreSQL Database Connection
 * 
 * Usage: node test-db-connection.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  console.log('🔌 Testing Database Connection...\n');
  
  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful!\n');
    
    // Test query
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('📊 PostgreSQL Version:', result[0].version);
    
    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log('\n📋 Existing tables:');
    if (tables.length === 0) {
      console.log('   (No tables found - run migrations first)');
    } else {
      tables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    }
    
    console.log('\n✅ Database is ready!');
    console.log('💡 Next step: Run migrations with: npx prisma migrate deploy\n');
    
  } catch (error) {
    console.error('❌ Connection failed!\n');
    console.error('Error:', error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('1. Check DATABASE_URL in .env file');
    console.error('2. Verify database credentials');
    console.error('3. Check Trusted Sources in DigitalOcean dashboard');
    console.error('4. Ensure SSL mode is set to "require"');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

