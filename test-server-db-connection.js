require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const net = require('net');

const prisma = new PrismaClient();

async function testConnection() {
  console.log('🔌 Testing Server Database Connection...\n');
  
  // Show connection details (masked password)
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    const masked = dbUrl.replace(/:[^:@]+@/, ':****@');
    console.log('📋 Connection String:', masked);
    console.log('');
  }
  
  // Extract host and port
  const match = dbUrl?.match(/@([^:]+):(\d+)/);
  if (match) {
    const host = match[1];
    const port = parseInt(match[2]);
    
    console.log('🌐 Testing Network Connectivity...');
    console.log(`   Host: ${host}`);
    console.log(`   Port: ${port}`);
    
    // Test TCP connection
    await new Promise((resolve, reject) => {
      const socket = new net.Socket();
      const timeout = 5000;
      
      socket.setTimeout(timeout);
      
      socket.on('connect', () => {
        console.log('   ✅ TCP connection successful');
        socket.destroy();
        resolve();
      });
      
      socket.on('timeout', () => {
        console.log('   ❌ Connection timeout');
        socket.destroy();
        reject(new Error('Connection timeout'));
      });
      
      socket.on('error', (err) => {
        console.log(`   ❌ Connection error: ${err.message}`);
        reject(err);
      });
      
      socket.connect(port, host);
    }).catch(() => {
      console.log('\n⚠️  Network connectivity test failed.');
      console.log('   This might be due to:');
      console.log('   1. Firewall blocking the connection');
      console.log('   2. IP not whitelisted in DigitalOcean Trusted Sources');
      console.log('   3. Database server not accessible from your location\n');
    });
  }
  
  console.log('\n🗄️  Testing Prisma Database Connection...\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful!\n');
    
    // Test query
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('📊 PostgreSQL Version:', result[0].version);
    
    // Check tables
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
      console.log(`   Found ${tables.length} tables:`);
      tables.slice(0, 10).forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
      if (tables.length > 10) {
        console.log(`   ... and ${tables.length - 10} more`);
      }
    }
    
    // Test data queries
    try {
      const userCount = await prisma.user.count();
      const employeeCount = await prisma.employee.count();
      console.log(`\n📊 Data Summary:`);
      console.log(`   Users: ${userCount}`);
      console.log(`   Employees: ${employeeCount}`);
    } catch (e) {
      console.log('\n⚠️  Could not query data (tables might not exist yet)');
    }
    
    console.log('\n✅ Server database is ready!');
    
  } catch (error) {
    console.error('\n❌ Database connection failed!\n');
    console.error('Error:', error.message);
    console.error('\n🔍 Troubleshooting Steps:');
    console.error('1. Verify DATABASE_URL in .env file is correct');
    console.error('2. Check DigitalOcean dashboard → Database → Trusted Sources');
    console.error('   - Add your current IP address');
    console.error('   - Or enable "App Platform" if deploying there');
    console.error('3. Verify database credentials (username/password)');
    console.error('4. Ensure SSL mode is set to "require"');
    console.error('5. Check if database cluster is running in DigitalOcean');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

