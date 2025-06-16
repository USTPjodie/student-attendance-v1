import mysql from 'mysql2/promise';

async function checkDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'student_attendance',
    });

    console.log('✅ Database connection successful');
    
    // Check all tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('\n📋 Available tables:');
    console.log(tables);
    
    // Check date-related columns in each table
    const tablesToCheck = ['users', 'classes', 'students', 'class_enrollments', 'attendance_records', 'consultations', 'assignments', 'grades', 'teacher_availability'];
    
    for (const table of tablesToCheck) {
      try {
        const [columns] = await connection.query(`DESCRIBE ${table}`);
        console.log(`\n🗂️  ${table.toUpperCase()} TABLE STRUCTURE:`);
        
        // Filter for date/time related columns
        const dateColumns = (columns as any[]).filter(col => 
          col.Type.includes('timestamp') || 
          col.Type.includes('date') || 
          col.Type.includes('time')
        );
        
        if (dateColumns.length > 0) {
          console.log('📅 Date/Time columns:');
          dateColumns.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type} (Default: ${col.Default}, Null: ${col.Null})`);
          });
        } else {
          console.log('  No date/time columns found');
        }
        
        // Check for sample data
        const [sampleData] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`  📊 Records: ${(sampleData as any[])[0].count}`);
        
      } catch (error) {
        console.log(`❌ Table ${table} does not exist or error: ${error}`);
      }
    }
    
    // Test date relationships
    console.log('\n🔗 Testing Date Relationships:');
    
    // Check attendance records with dates
    try {
      const [attendanceData] = await connection.query(`
        SELECT 
          ar.id,
          ar.date,
          ar.created_at,
          ar.status,
          CONCAT(u.first_name, ' ', u.last_name) as student_name,
          c.name as class_name
        FROM attendance_records ar
        JOIN students s ON ar.student_id = s.id
        JOIN users u ON s.user_id = u.id
        JOIN classes c ON ar.class_id = c.id
        ORDER BY ar.date DESC
        LIMIT 5
      `);
      
      console.log('📝 Recent attendance records:');
      if ((attendanceData as any[]).length > 0) {
        (attendanceData as any[]).forEach(record => {
          console.log(`  - ${record.student_name} in ${record.class_name}: ${record.status} on ${record.date} (created: ${record.created_at})`);
        });
      } else {
        console.log('  No attendance records found');
      }
    } catch (error) {
      console.log(`❌ Error checking attendance records: ${error}`);
    }
    
    // Check consultations with dates
    try {
      const [consultationData] = await connection.query(`
        SELECT 
          c.id,
          c.date_time,
          c.created_at,
          c.status,
          c.purpose,
          CONCAT(teacher.first_name, ' ', teacher.last_name) as teacher_name,
          CONCAT(student_user.first_name, ' ', student_user.last_name) as student_name
        FROM consultations c
        JOIN users teacher ON c.teacher_id = teacher.id
        JOIN students s ON c.student_id = s.id
        JOIN users student_user ON s.user_id = student_user.id
        ORDER BY c.date_time DESC
        LIMIT 5
      `);
      
      console.log('\n👥 Recent consultations:');
      if ((consultationData as any[]).length > 0) {
        (consultationData as any[]).forEach(record => {
          console.log(`  - ${record.student_name} with ${record.teacher_name}: ${record.purpose} on ${record.date_time} (status: ${record.status})`);
        });
      } else {
        console.log('  No consultation records found');
      }
    } catch (error) {
      console.log(`❌ Error checking consultations: ${error}`);
    }
    
    // Check assignments with due dates
    try {
      const [assignmentData] = await connection.query(`
        SELECT 
          a.id,
          a.title,
          a.due_date,
          a.created_at,
          a.type,
          c.name as class_name
        FROM assignments a
        JOIN classes c ON a.class_id = c.id
        ORDER BY a.due_date DESC
        LIMIT 5
      `);
      
      console.log('\n📚 Recent assignments:');
      if ((assignmentData as any[]).length > 0) {
        (assignmentData as any[]).forEach(record => {
          console.log(`  - ${record.title} (${record.type}) in ${record.class_name}: due ${record.due_date || 'No due date'}`);
        });
      } else {
        console.log('  No assignment records found');
      }
    } catch (error) {
      console.log(`❌ Error checking assignments: ${error}`);
    }
    
    await connection.end();
    console.log('\n✅ Database check completed successfully');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
}

checkDatabase();
