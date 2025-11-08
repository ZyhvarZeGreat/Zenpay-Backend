/**
 * Setup Fresh Database on DigitalOcean
 * Updates .env and runs Prisma migrations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get DATABASE_URL from environment or use placeholder
// For production, set DATABASE_URL in your environment variables
const DO_DATABASE_URL = process.env.DATABASE_URL || 'postgresql://doadmin:YOUR_PASSWORD@zenpay-db-do-user-23325703-0.h.db.ondigitalocean.com:25060/defaultdb?sslmode=require';

async function setupDatabase() {
  console.log('🚀 Setting up fresh database on DigitalOcean\n');

  // Step 1: Update .env file
  console.log('📝 Step 1: Updating .env file...');

  const envPath = path.join(__dirname, '.env');

  if (!fs.existsSync(envPath)) {
    console.log('   ⚠️  .env file not found, creating new one...');
    fs.writeFileSync(envPath, '');
  }

  let envContent = fs.readFileSync(envPath, 'utf8');

  // Remove old DATABASE_URL if exists
  envContent = envContent.replace(/^DATABASE_URL=.*$/m, '');

  // Add new DATABASE_URL
  if (!envContent.endsWith('\n') && envContent.length > 0) {
    envContent += '\n';
  }
  envContent += `DATABASE_URL="${DO_DATABASE_URL}"\n`;

  fs.writeFileSync(envPath, envContent);
  console.log('   ✅ DATABASE_URL updated in .env\n');

  // Step 2: Test connection
  console.log('🔌 Step 2: Testing database connection...\n');

  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    await prisma.$connect();
    console.log('   ✅ Database connection successful!\n');
    await prisma.$disconnect();
  } catch (error) {
    console.error('   ❌ Connection failed:', error.message);
    console.error('\n   💡 Make sure:');
    console.error('      1. Your IP is added to Trusted Sources in DigitalOcean');
    console.error('      2. Database cluster is running');
    console.error('      3. Connection details are correct\n');
    process.exit(1);
  }

  // Step 3: Generate Prisma Client
  console.log('🔧 Step 3: Generating Prisma Client...\n');

  try {
    execSync('npx prisma generate', { stdio: 'inherit', cwd: __dirname });
    console.log('\n   ✅ Prisma Client generated\n');
  } catch (error) {
    console.error('\n   ❌ Failed to generate Prisma Client');
    process.exit(1);
  }

  // Step 4: Run migrations
  console.log('📊 Step 4: Running database migrations...\n');

  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: __dirname });
    console.log('\n   ✅ Migrations completed successfully!\n');
  } catch (error) {
    console.error('\n   ❌ Migrations failed');
    process.exit(1);
  }

  // Step 5: Verify tables
  console.log('✅ Step 5: Verifying database setup...\n');

  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    console.log(`   ✅ Found ${tables.length} tables:`);
    tables.forEach(table => {
      console.log(`      - ${table.table_name}`);
    });

    await prisma.$disconnect();
    console.log('\n🎉 Database setup complete!\n');
    console.log('Next steps:');
    console.log('   1. Start your application: npm start');
    console.log('   2. Test API endpoints');
    console.log('   3. Create your first user/employee\n');
  } catch (error) {
    console.error('   ⚠️  Could not verify tables:', error.message);
    console.log('\n   But migrations completed, so you should be good!\n');
  }
}

// Run setup
setupDatabase().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

