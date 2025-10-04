# Quick Reference Guide

## Docker Commands

### Check Status
```bash
docker ps
```

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
docker logs attendance_app
docker logs attendance_db
```

## Database Commands

### Access MySQL
```bash
docker exec -it attendance_db mysql -u appuser -papppassword student_attendance
```

### Check Tables
```sql
SHOW TABLES;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM students;
SELECT COUNT(*) FROM classes;
SELECT COUNT(*) FROM class_enrollments;
```

## Application Scripts

### Verify Database Connection
```bash
docker exec -it attendance_app node check-db.js
```

### Reseed Database
```bash
docker exec -it attendance_app node reseed-db.js
```

## Common API Tests

### Teacher Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"prof.smith@ustp.edu.ph","password":"password123"}'
```

### Student Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice.doe@student.ustp.edu.ph","password":"password123"}'
```

## Demo Credentials

### Teachers
- prof.smith@ustp.edu.ph / password123
- maria.garcia@ustp.edu.ph / password123
- robert.chen@ustp.edu.ph / password123
- sarah.wilson@ustp.edu.ph / password123

### Students
- alice.doe@student.ustp.edu.ph / password123
- juan.delacruz@student.ustp.edu.ph / password123
- maria.santos@student.ustp.edu.ph / password123
- james.wilson@student.ustp.edu.ph / password123
- sophia.chen@student.ustp.edu.ph / password123
- miguel.garcia@student.ustp.edu.ph / password123
- isabella.lee@student.ustp.edu.ph / password123
- lucas.martinez@student.ustp.edu.ph / password123
- emma.tan@student.ustp.edu.ph / password123

## Troubleshooting Checklist

1. [ ] Docker containers running?
2. [ ] Database accessible?
3. [ ] Users exist with proper passwords?
4. [ ] Class enrollments populated?
5. [ ] Application logs showing errors?

## Emergency Reset

WARNING: This will delete all data!

```bash
docker-compose down -v
docker-compose up --build
docker exec -it attendance_app node reseed-db.js
```