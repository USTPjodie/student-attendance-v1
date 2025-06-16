async function testAPI() {
  const baseURL = 'http://localhost:5000';
  
  console.log('🔍 Testing API Endpoints for Date Functionality\n');

  try {
    // Test 1: Login first to get session
    console.log('🔐 Test 1: Authentication');
    const loginResponse = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'john.smith@ustp.edu.ph',
        password: 'password123'
      }),
      credentials: 'include'
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful:', loginData.user.email, loginData.user.role);
      
      // Use credentials: 'include' for subsequent requests
      const headers = {
        'Content-Type': 'application/json'
      };
      const fetchOptions = {
        headers,
        credentials: 'include' as RequestCredentials
      };

      // Test 2: Get classes (should work now)
      console.log('\n📚 Test 2: Classes API');
      const classesResponse = await fetch(`${baseURL}/api/classes`, fetchOptions);
      if (classesResponse.ok) {
        const classes = await classesResponse.json();
        console.log(`✅ Classes retrieved: ${classes.length} classes found`);
        classes.slice(0, 2).forEach((cls: any) => {
          console.log(`   - ${cls.name} (${cls.code}) - Created: ${cls.created_at}`);
        });
      } else {
        console.log('❌ Classes API failed:', await classesResponse.text());
      }

      // Test 3: Get attendance records
      console.log('\n📝 Test 3: Attendance API');
      if (classes && classes.length > 0) {
        const classId = classes[0].id;
        const attendanceResponse = await fetch(`${baseURL}/api/attendance?classId=${classId}`, fetchOptions);
        if (attendanceResponse.ok) {
          const attendance = await attendanceResponse.json();
          console.log(`✅ Attendance records retrieved: ${attendance.length} records found`);
          attendance.slice(0, 3).forEach((record: any) => {
            console.log(`   - Student ${record.student_id}: ${record.status} on ${record.date}`);
          });
        } else {
          console.log('❌ Attendance API failed:', await attendanceResponse.text());
        }
      }

      // Test 4: Get consultations
      console.log('\n👥 Test 4: Consultations API');
      const consultationsResponse = await fetch(`${baseURL}/api/consultations`, fetchOptions);
      if (consultationsResponse.ok) {
        const consultations = await consultationsResponse.json();
        console.log(`✅ Consultations retrieved: ${consultations.length} consultations found`);
        consultations.slice(0, 3).forEach((consultation: any) => {
          console.log(`   - ${consultation.student_name || 'Student'} with ${consultation.teacher_name || 'Teacher'}: ${consultation.date_time} [${consultation.status}]`);
        });
      } else {
        console.log('❌ Consultations API failed:', await consultationsResponse.text());
      }

      // Test 5: Get teacher availability
      console.log('\n⏰ Test 5: Teacher Availability API');
      const availabilityResponse = await fetch(`${baseURL}/api/availability`, fetchOptions);
      if (availabilityResponse.ok) {
        const availability = await availabilityResponse.json();
        console.log(`✅ Availability retrieved: ${availability.length} time slots found`);
        availability.slice(0, 3).forEach((slot: any) => {
          console.log(`   - ${slot.day}: ${slot.startTime} - ${slot.endTime}`);
        });
      } else {
        console.log('❌ Availability API failed:', await availabilityResponse.text());
      }

      // Test 6: Test date filtering for attendance
      console.log('\n📅 Test 6: Date Filtering');
      if (classes && classes.length > 0) {
        const classId = classes[0].id;
        const today = new Date().toISOString().split('T')[0];
        const dateFilterResponse = await fetch(`${baseURL}/api/attendance?classId=${classId}&date=${today}`, fetchOptions);
        if (dateFilterResponse.ok) {
          const todayAttendance = await dateFilterResponse.json();
          console.log(`✅ Today's attendance: ${todayAttendance.length} records found`);
        } else {
          console.log('❌ Date filtering failed:', await dateFilterResponse.text());
        }
      }

    } else {
      console.log('❌ Login failed:', await loginResponse.text());
    }

  } catch (error) {
    console.error('❌ API Test Error:', error);
  }

  console.log('\n🎉 API Testing Complete!');
}

testAPI();
