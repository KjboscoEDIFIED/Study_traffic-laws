/**
 * Run this script to reset the admin password
 * Usage: node reset-admin.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, connectDB } = require('./src/config/database');

const resetAdmin = async () => {
    await connectDB();

    const newPassword = 'Admin@123';
    const hash = await bcrypt.hash(newPassword, 10);

    console.log('Generated hash:', hash);

    const [result] = await pool.execute(
        "UPDATE users SET password_hash = ? WHERE phone = '0780000000'",
        [hash]
    );

    if (result.affectedRows > 0) {
        console.log('✅ Admin password reset successfully!');
        console.log('   Phone:    0780000000');
        console.log('   Password: Admin@123');
    } else {
        console.log('❌ Admin user not found. Creating...');
        await pool.execute(
            `INSERT INTO users (full_name, phone, email, password_hash, role)
       VALUES ('System Administrator', '0780000000', 'admin@trafficexam.rw', ?, 'admin')`,
            [hash]
        );
        console.log('✅ Admin user created!');
        console.log('   Phone:    0780000000');
        console.log('   Password: Admin@123');
    }

    process.exit(0);
};

resetAdmin().catch((err) => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});