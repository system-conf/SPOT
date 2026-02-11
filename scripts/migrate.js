const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'spot',
        port: Number(process.env.DB_PORT || 3306),
    });

    try {
        console.log('Starting migration...');

        // Create notification_templates table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS \`notification_templates\` (
                \`id\` int AUTO_INCREMENT NOT NULL,
                \`name\` varchar(64) NOT NULL,
                \`slug\` varchar(64) NOT NULL,
                \`channel_id\` int,
                \`title\` varchar(256) NOT NULL,
                \`body\` varchar(1024) NOT NULL,
                \`icon\` varchar(512),
                \`image\` varchar(512),
                \`url\` varchar(512),
                \`badge\` varchar(512),
                \`actions\` text,
                \`variables\` text,
                \`is_active\` boolean NOT NULL DEFAULT true,
                \`created_at\` timestamp DEFAULT (now()),
                \`updated_at\` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT \`notification_templates_id\` PRIMARY KEY(\`id\`),
                CONSTRAINT \`notification_templates_slug_unique\` UNIQUE(\`slug\`)
            )
        `);
        console.log('✓ notification_templates table created');

        // Add image column to notification_templates if not exists
        const [templateImageRows] = await connection.execute(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notification_templates' AND COLUMN_NAME = 'image'
        `);

        if (templateImageRows.length === 0) {
            await connection.execute(`ALTER TABLE \`notification_templates\` ADD \`image\` varchar(512)`);
            console.log('✓ Added image to notification_templates');
        } else {
            console.log('⊙ image already exists in notification_templates');
        }

        // Create security_logs table
        const [securityLogsRows] = await connection.execute(`
            SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'security_logs'
        `);

        if (securityLogsRows.length === 0) {
            await connection.execute(`
                CREATE TABLE \`security_logs\` (
                    \`id\` int AUTO_INCREMENT NOT NULL,
                    \`ip\` varchar(64) NOT NULL,
                    \`user_agent\` varchar(512),
                    \`method\` varchar(8) NOT NULL,
                    \`path\` varchar(256) NOT NULL,
                    \`event\` varchar(64) NOT NULL,
                    \`status\` int,
                    \`details\` text,
                    \`created_at\` timestamp DEFAULT (now()),
                    CONSTRAINT \`security_logs_id\` PRIMARY KEY(\`id\`)
                )
            `);
            console.log('✓ security_logs table created');
        } else {
            console.log('⊙ security_logs table already exists');
        }

        // Add columns to notifications table
        const notificationColumns = [
            'image varchar(512)',
            'badge varchar(512)',
            'actions text',
            'require_interaction boolean DEFAULT false'
        ];

        for (const column of notificationColumns) {
            const [columnName] = column.split(' ');
            const [rows] = await connection.execute(`
                SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = ?
            `, [columnName]);

            if (rows.length === 0) {
                await connection.execute(`ALTER TABLE \`notifications\` ADD ${column}`);
                console.log(`✓ Added ${columnName} to notifications`);
            } else {
                console.log(`⊙ ${columnName} already exists in notifications`);
            }
        }

        // Add columns to scheduled_notifications table
        const scheduledColumns = [
            'image varchar(512)',
            'badge varchar(512)',
            'actions text',
            'require_interaction boolean DEFAULT false'
        ];

        for (const column of scheduledColumns) {
            const [columnName] = column.split(' ');
            const [rows] = await connection.execute(`
                SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'scheduled_notifications' AND COLUMN_NAME = ?
            `, [columnName]);

            if (rows.length === 0) {
                await connection.execute(`ALTER TABLE \`scheduled_notifications\` ADD ${column}`);
                console.log(`✓ Added ${columnName} to scheduled_notifications`);
            } else {
                console.log(`⊙ ${columnName} already exists in scheduled_notifications`);
            }
        }

        // Add columns to subscriptions table
        const subscriptionColumns = [
            'channel_id int',
            'user_agent varchar(512)',
            'is_active boolean DEFAULT true NOT NULL',
            'last_used_at timestamp',
            'updated_at timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP'
        ];

        for (const column of subscriptionColumns) {
            const [columnName] = column.split(' ');
            const [rows] = await connection.execute(`
                SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'subscriptions' AND COLUMN_NAME = ?
            `, [columnName]);

            if (rows.length === 0) {
                await connection.execute(`ALTER TABLE \`subscriptions\` ADD ${column}`);
                console.log(`✓ Added ${columnName} to subscriptions`);
            } else {
                console.log(`⊙ ${columnName} already exists in subscriptions`);
            }
        }

        // ─── Performance Indexes ───────────────────────────────────────
        console.log('Creating performance indexes...');

        // Channels table indexes
        const channelIndexes = [
            { name: 'idx_channels_api_key', column: 'api_key', table: 'channels' },
            { name: 'idx_channels_slug', column: 'slug', table: 'channels' },
            { name: 'idx_channels_is_active', column: 'is_active', table: 'channels' }
        ];

        for (const idx of channelIndexes) {
            const [indexRows] = await connection.execute(`
                SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?
            `, [idx.table, idx.name]);

            if (indexRows.length === 0) {
                await connection.execute(`CREATE INDEX \`${idx.name}\` ON \`${idx.table}\`(\`${idx.column}\`)`);
                console.log(`✓ Created index ${idx.name}`);
            } else {
                console.log(`⊙ Index ${idx.name} already exists`);
            }
        }

        // Subscriptions table indexes
        const subscriptionIndexes = [
            { name: 'idx_subscriptions_channel_id', column: 'channel_id', table: 'subscriptions' },
            { name: 'idx_subscriptions_is_active', column: 'is_active', table: 'subscriptions' },
            { name: 'idx_subscriptions_last_used_at', column: 'last_used_at', table: 'subscriptions' },
            { name: 'idx_subscriptions_channel_active', columns: ['channel_id', 'is_active'], table: 'subscriptions' }
        ];

        for (const idx of subscriptionIndexes) {
            const [indexRows] = await connection.execute(`
                SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?
            `, [idx.table, idx.name]);

            if (indexRows.length === 0) {
                if (idx.columns) {
                    await connection.execute(`CREATE INDEX \`${idx.name}\` ON \`${idx.table}\`(\`${idx.columns.join('`, `')}\`)`);
                } else {
                    await connection.execute(`CREATE INDEX \`${idx.name}\` ON \`${idx.table}\`(\`${idx.column}\`)`);
                }
                console.log(`✓ Created index ${idx.name}`);
            } else {
                console.log(`⊙ Index ${idx.name} already exists`);
            }
        }

        // Notifications table indexes
        const notificationIndexes = [
            { name: 'idx_notifications_channel_id', column: 'channel_id', table: 'notifications' },
            { name: 'idx_notifications_status', column: 'status', table: 'notifications' },
            { name: 'idx_notifications_sent_at', column: 'sent_at', table: 'notifications' },
            { name: 'idx_notifications_channel_status', columns: ['channel_id', 'status'], table: 'notifications' },
            { name: 'idx_notifications_sent_at_desc', column: 'sent_at', table: 'notifications', desc: true }
        ];

        for (const idx of notificationIndexes) {
            const [indexRows] = await connection.execute(`
                SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?
            `, [idx.table, idx.name]);

            if (indexRows.length === 0) {
                if (idx.columns) {
                    await connection.execute(`CREATE INDEX \`${idx.name}\` ON \`${idx.table}\`(\`${idx.columns.join('`, `')}\`)`);
                } else if (idx.desc) {
                    await connection.execute(`CREATE INDEX \`${idx.name}\` ON \`${idx.table}\`(\`${idx.column}\` DESC)`);
                } else {
                    await connection.execute(`CREATE INDEX \`${idx.name}\` ON \`${idx.table}\`(\`${idx.column}\`)`);
                }
                console.log(`✓ Created index ${idx.name}`);
            } else {
                console.log(`⊙ Index ${idx.name} already exists`);
            }
        }

        // Scheduled notifications table indexes
        const scheduledIndexes = [
            { name: 'idx_scheduled_notifications_channel_id', column: 'channel_id', table: 'scheduled_notifications' },
            { name: 'idx_scheduled_notifications_scheduled_at', column: 'scheduled_at', table: 'scheduled_notifications' },
            { name: 'idx_scheduled_notifications_status', column: 'status', table: 'scheduled_notifications' },
            { name: 'idx_scheduled_notifications_pending', columns: ['status', 'scheduled_at'], table: 'scheduled_notifications' }
        ];

        for (const idx of scheduledIndexes) {
            const [indexRows] = await connection.execute(`
                SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?
            `, [idx.table, idx.name]);

            if (indexRows.length === 0) {
                if (idx.columns) {
                    await connection.execute(`CREATE INDEX \`${idx.name}\` ON \`${idx.table}\`(\`${idx.columns.join('`, `')}\`)`);
                } else {
                    await connection.execute(`CREATE INDEX \`${idx.name}\` ON \`${idx.table}\`(\`${idx.column}\`)`);
                }
                console.log(`✓ Created index ${idx.name}`);
            } else {
                console.log(`⊙ Index ${idx.name} already exists`);
            }
        }

        // Notification templates table indexes
        const templateIndexes = [
            { name: 'idx_notification_templates_channel_id', column: 'channel_id', table: 'notification_templates' },
            { name: 'idx_notification_templates_slug', column: 'slug', table: 'notification_templates' },
            { name: 'idx_notification_templates_is_active', column: 'is_active', table: 'notification_templates' }
        ];

        for (const idx of templateIndexes) {
            const [indexRows] = await connection.execute(`
                SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?
            `, [idx.table, idx.name]);

            if (indexRows.length === 0) {
                await connection.execute(`CREATE INDEX \`${idx.name}\` ON \`${idx.table}\`(\`${idx.column}\`)`);
                console.log(`✓ Created index ${idx.name}`);
            } else {
                console.log(`⊙ Index ${idx.name} already exists`);
            }
        }

        // Security logs table indexes
        const securityLogIndexes = [
            { name: 'idx_security_logs_ip', column: 'ip', table: 'security_logs' },
            { name: 'idx_security_logs_event', column: 'event', table: 'security_logs' },
            { name: 'idx_security_logs_created_at', column: 'created_at', table: 'security_logs' },
            { name: 'idx_security_logs_created_at_desc', column: 'created_at', table: 'security_logs', desc: true },
            { name: 'idx_security_logs_event_created', columns: ['event', 'created_at'], table: 'security_logs' }
        ];

        for (const idx of securityLogIndexes) {
            const [indexRows] = await connection.execute(`
                SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?
            `, [idx.table, idx.name]);

            if (indexRows.length === 0) {
                if (idx.columns) {
                    await connection.execute(`CREATE INDEX \`${idx.name}\` ON \`${idx.table}\`(\`${idx.columns.join('`, `')}\`)`);
                } else if (idx.desc) {
                    await connection.execute(`CREATE INDEX \`${idx.name}\` ON \`${idx.table}\`(\`${idx.column}\` DESC)`);
                } else {
                    await connection.execute(`CREATE INDEX \`${idx.name}\` ON \`${idx.table}\`(\`${idx.column}\`)`);
                }
                console.log(`✓ Created index ${idx.name}`);
            } else {
                console.log(`⊙ Index ${idx.name} already exists`);
            }
        }

        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

runMigration().catch(console.error);
