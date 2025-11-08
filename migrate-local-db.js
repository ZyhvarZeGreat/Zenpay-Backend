/**
 * Interactive Database Migration Script
 * Migrates local database to DigitalOcean PostgreSQL
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// DigitalOcean connection details
const DO_CONFIG = {
  host: 'zenpay-db-do-user-23325703-0.h.db.ondigitalocean.com',
  port: '25060',
  database: 'defaultdb',
  user: 'doadmin',
  password: process.env.DO_DB_PASSWORD || await question('DigitalOcean Database Password: '),
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function checkCommand(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    try {
      execSync(`where ${command}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
}

async function getLocalDbConfig() {
  console.log('\n📋 Local Database Configuration\n');
  console.log('Please provide your local database connection details:\n');

  const host = await question('Database Host (default: localhost): ') || 'localhost';
  const port = await question('Database Port (default: 5432): ') || '5432';
  const database = await question('Database Name: ');
  const user = await question('Database User: ');
  const password = await question('Database Password: ');

  return { host, port, database, user, password };
}

function createDump(localConfig) {
  console.log('\n📦 Step 1: Creating database dump...\n');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dumpFile = path.join(__dirname, `zenpay_migration_${timestamp}.dump`);

  console.log(`   Source: ${localConfig.host}:${localConfig.port}/${localConfig.database}`);
  console.log(`   Output: ${dumpFile}\n`);

  try {
    // Set password as environment variable
    const env = { ...process.env };
    if (localConfig.password) {
      env.PGPASSWORD = localConfig.password;
    }

    execSync(
      `pg_dump -U "${localConfig.user}" -h "${localConfig.host}" -p "${localConfig.port}" -d "${localConfig.database}" -F c -f "${dumpFile}" --verbose`,
      { 
        stdio: 'inherit',
        env,
        shell: true,
      }
    );

    const stats = fs.statSync(dumpFile);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`\n✅ Dump created successfully!`);
    console.log(`   File: ${dumpFile}`);
    console.log(`   Size: ${sizeMB} MB\n`);

    return dumpFile;
  } catch (error) {
    console.error('\n❌ Failed to create dump');
    console.error('   Error:', error.message);
    throw error;
  }
}

function restoreDump(dumpFile) {
  console.log('📤 Step 2: Restoring to DigitalOcean...\n');

  console.log(`   Target: ${DO_CONFIG.host}:${DO_CONFIG.port}/${DO_CONFIG.database}`);
  console.log(`   File: ${dumpFile}\n`);

  try {
    // Set password as environment variable
    const env = { ...process.env };
    env.PGPASSWORD = DO_CONFIG.password;

    execSync(
      `pg_restore -U "${DO_CONFIG.user}" -h "${DO_CONFIG.host}" -p "${DO_CONFIG.port}" -d "${DO_CONFIG.database}" --verbose --no-owner --no-acl "${dumpFile}"`,
      {
        stdio: 'inherit',
        env,
        shell: true,
      }
    );

    console.log('\n✅ Migration completed successfully!\n');
    return true;
  } catch (error) {
    console.error('\n❌ Failed to restore dump');
    console.error('   Error:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check Trusted Sources in DigitalOcean dashboard');
    console.error('   2. Verify your IP is added to allowed sources');
    console.error('   3. Check connection details');
    throw error;
  }
}

async function verifyMigration() {
  console.log('🔍 Step 3: Verifying migration...\n');

  try {
    const env = { ...process.env };
    env.PGPASSWORD = DO_CONFIG.password;

    const result = execSync(
      `psql -U "${DO_CONFIG.user}" -h "${DO_CONFIG.host}" -p "${DO_CONFIG.port}" -d "${DO_CONFIG.database}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"`,
      {
        env,
        encoding: 'utf8',
        shell: true,
      }
    );

    const tableCount = result.trim();
    console.log(`   ✅ Tables found: ${tableCount}\n`);

    if (parseInt(tableCount) > 0) {
      console.log('✅ Migration verified successfully!\n');
      return true;
    } else {
      console.log('⚠️  No tables found. Migration may have failed.\n');
      return false;
    }
  } catch (error) {
    console.error('⚠️  Could not verify migration automatically');
    console.error('   You can verify manually using: node test-db-connection.js\n');
    return false;
  }
}

async function main() {
  console.log('🔄 Database Migration Tool');
  console.log('==========================\n');
  console.log('This script will:');
  console.log('  1. Create a dump from your local database');
  console.log('  2. Restore it to DigitalOcean PostgreSQL');
  console.log('  3. Verify the migration\n');

  // Check if pg_dump and pg_restore are available
  if (!checkCommand('pg_dump')) {
    console.error('❌ pg_dump not found!');
    console.error('   Please install PostgreSQL client tools:');
    console.error('   - Windows: https://www.postgresql.org/download/windows/');
    console.error('   - macOS: brew install postgresql');
    console.error('   - Linux: sudo apt-get install postgresql-client\n');
    process.exit(1);
  }

  if (!checkCommand('pg_restore')) {
    console.error('❌ pg_restore not found!');
    console.error('   Please install PostgreSQL client tools\n');
    process.exit(1);
  }

  try {
    // Get local database config
    const localConfig = await getLocalDbConfig();

    if (!localConfig.database || !localConfig.user) {
      console.error('\n❌ Database name and user are required!');
      process.exit(1);
    }

    // Confirm before proceeding
    console.log('\n📋 Migration Summary:');
    console.log(`   From: ${localConfig.host}:${localConfig.port}/${localConfig.database}`);
    console.log(`   To:   ${DO_CONFIG.host}:${DO_CONFIG.port}/${DO_CONFIG.database}`);
    const confirm = await question('\n⚠️  Proceed with migration? (yes/no): ');

    if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
      console.log('\n❌ Migration cancelled.');
      rl.close();
      return;
    }

    // Create dump
    const dumpFile = createDump(localConfig);

    // Restore to DigitalOcean
    const success = restoreDump(dumpFile);

    if (success) {
      // Verify migration
      await verifyMigration();

      // Cleanup
      const cleanup = await question('\n🗑️  Delete dump file? (yes/no, default: yes): ');
      if (cleanup.toLowerCase() !== 'no' && cleanup.toLowerCase() !== 'n') {
        fs.unlinkSync(dumpFile);
        console.log('✅ Dump file deleted\n');
      } else {
        console.log(`💾 Dump file preserved: ${dumpFile}\n`);
      }

      console.log('🎉 Migration completed successfully!\n');
      console.log('Next steps:');
      console.log('  1. Update DATABASE_URL in your .env file');
      console.log('  2. Test connection: node test-db-connection.js');
      console.log('  3. Start your application\n');
    }
  } catch (error) {
    console.error('\n❌ Migration failed!');
    console.error('   Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run migration
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

