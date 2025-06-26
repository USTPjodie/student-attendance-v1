import mysql from 'mysql2/promise';

async function comprehensiveDbAnalysis() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'student_attendance',
    });

    console.log('🔍 COMPREHENSIVE DATABASE STRUCTURE & IMPLEMENTATION ANALYSIS');
    console.log('=' .repeat(80));

    // 1. Schema Consistency Check
    console.log('\n📋 1. SCHEMA CONSISTENCY ANALYSIS');
    console.log('-' .repeat(50));
    
    const tables = [
      'users', 'classes', 'students', 'class_enrollments', 
      'attendance_records', 'consultations', 'assignments', 
      'grades', 'teacher_availability'
    ];

    for (const table of tables) {
      try {
        const [columns] = await connection.query(`DESCRIBE ${table}`);
        console.log(`\n✅ ${table.toUpperCase()} TABLE:`);
        
        // Check for proper indexing
        const [indexes] = await connection.query(`SHOW INDEX FROM ${table}`);
        const indexCount = (indexes as any[]).length;
        console.log(`   📊 Indexes: ${indexCount}`);
        
        // Check for foreign keys
        const [foreignKeys] = await connection.query(`
          SELECT 
            COLUMN_NAME,
            REFERENCED_TABLE_NAME,
            REFERENCED_COLUMN_NAME
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
          WHERE TABLE_SCHEMA = 'student_attendance' 
          AND TABLE_NAME = '${table}' 
          AND REFERENCED_TABLE_NAME IS NOT NULL
        `);
        
        if ((foreignKeys as any[]).length > 0) {
          console.log(`   🔗 Foreign Keys: ${(foreignKeys as any[]).length}`);
          (foreignKeys as any[]).forEach(fk => {
            console.log(`      - ${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
          });
        }
        
        // Check for date/time columns
        const dateColumns = (columns as any[]).filter(col => 
          col.Type.includes('timestamp') || col.Type.includes('date') || col.Type.includes('time')
        );
        
        if (dateColumns.length > 0) {
          console.log(`   📅 Date/Time Columns: ${dateColumns.length}`);
          dateColumns.forEach(col => {
            console.log(`      - ${col.Field}: ${col.Type} (Default: ${col.Default})`);
          });
        }
        
      } catch (error) {
        console.log(`❌ Error analyzing ${table}:`, error);
      }
    }

    // 2. Data Integrity Check
    console.log('\n\n🔍 2. DATA INTEGRITY ANALYSIS');
    console.log('-' .repeat(50));
    
    // Check for orphaned records
    const integrityChecks = [
      {
        name: 'Orphaned Students',
        query: 'SELECT COUNT(*) as count FROM students s LEFT JOIN users u ON s.user_id = u.id WHERE u.id IS NULL'
      },
      {
        name: 'Orphaned Classes',
        query: 'SELECT COUNT(*) as count FROM classes c LEFT JOIN users u ON c.teacher_id = u.id WHERE u.id IS NULL'
      },
      {
        name: 'Orphaned Attendance Records',
        query: 'SELECT COUNT(*) as count FROM attendance_records ar LEFT JOIN classes c ON ar.class_id = c.id WHERE c.id IS NULL'
      },
      {
        name: 'Orphaned Consultations',
        query: 'SELECT COUNT(*) as count FROM consultations con LEFT JOIN users u ON con.teacher_id = u.id WHERE u.id IS NULL'
      }
    ];

    for (const check of integrityChecks) {
      try {
        const [result] = await connection.query(check.query);
        const count = (result as any[])[0].count;
        console.log(`${count === 0 ? '✅' : '❌'} ${check.name}: ${count} orphaned records`);
      } catch (error) {
        console.log(`❌ Error checking ${check.name}:`, error);
      }
    }

    // 3. Performance Analysis
    console.log('\n\n⚡ 3. PERFORMANCE ANALYSIS');
    console.log('-' .repeat(50));
    
    // Check table sizes
    const [tableSizes] = await connection.query(`
      SELECT 
        table_name,
        table_rows,
        ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
      FROM information_schema.tables 
      WHERE table_schema = 'student_attendance'
      ORDER BY (data_length + index_length) DESC
    `);
    
    console.log('📊 Table Sizes:');
    (tableSizes as any[]).forEach(table => {
      console.log(`   - ${table.table_name}: ${table.table_rows} rows, ${table['Size (MB)']} MB`);
    });

    // 4. Date Relationship Validation
    console.log('\n\n📅 4. DATE RELATIONSHIP VALIDATION');
    console.log('-' .repeat(50));
    
    // Check for future attendance records (should be 0)
    const [futureAttendance] = await connection.query(`
      SELECT COUNT(*) as count FROM attendance_records WHERE date > NOW()
    `);
    console.log(`${(futureAttendance as any[])[0].count === 0 ? '✅' : '❌'} Future attendance records: ${(futureAttendance as any[])[0].count}`);

    // Check for past consultations still pending
    const [pastPending] = await connection.query(`
      SELECT COUNT(*) as count FROM consultations WHERE date_time < NOW() AND status = 'pending'
    `);
    console.log(`${(pastPending as any[])[0].count === 0 ? '✅' : '⚠️'} Past consultations still pending: ${(pastPending as any[])[0].count}`);

    // Check for assignments without due dates
    const [noDueDate] = await connection.query(`
      SELECT COUNT(*) as count FROM assignments WHERE due_date IS NULL
    `);
    console.log(`ℹ️  Assignments without due dates: ${(noDueDate as any[])[0].count}`);

    // 5. Security Analysis
    console.log('\n\n🔒 5. SECURITY ANALYSIS');
    console.log('-' .repeat(50));
    
    // Check for users with weak passwords (length check)
    const [weakPasswords] = await connection.query(`
      SELECT COUNT(*) as count FROM users WHERE LENGTH(password) < 60
    `);
    console.log(`${(weakPasswords as any[])[0].count === 0 ? '✅' : '❌'} Users with potentially weak passwords: ${(weakPasswords as any[])[0].count}`);

    // Check for duplicate emails
    const [duplicateEmails] = await connection.query(`
      SELECT email, COUNT(*) as count FROM users GROUP BY email HAVING COUNT(*) > 1
    `);
    console.log(`${(duplicateEmails as any[]).length === 0 ? '✅' : '❌'} Duplicate email addresses: ${(duplicateEmails as any[]).length}`);

    // 6. Business Logic Validation
    console.log('\n\n💼 6. BUSINESS LOGIC VALIDATION');
    console.log('-' .repeat(50));
    
    // Check for students enrolled in non-existent classes
    const [invalidEnrollments] = await connection.query(`
      SELECT COUNT(*) as count FROM class_enrollments ce 
      LEFT JOIN classes c ON ce.class_id = c.id 
      WHERE c.id IS NULL
    `);
    console.log(`${(invalidEnrollments as any[])[0].count === 0 ? '✅' : '❌'} Invalid class enrollments: ${(invalidEnrollments as any[])[0].count}`);

    // Check for grades without corresponding assignments
    const [invalidGrades] = await connection.query(`
      SELECT COUNT(*) as count FROM grades g 
      LEFT JOIN assignments a ON g.assignment_id = a.id 
      WHERE a.id IS NULL
    `);
    console.log(`${(invalidGrades as any[])[0].count === 0 ? '✅' : '❌'} Grades without assignments: ${(invalidGrades as any[])[0].count}`);

    await connection.end();
    
    console.log('\n\n🎉 ANALYSIS COMPLETE!');
    console.log('=' .repeat(80));
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

comprehensiveDbAnalysis();
