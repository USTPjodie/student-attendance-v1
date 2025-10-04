# Login Verification Steps

## Once All Containers Are Running

1. **Verify all containers are running**:
   ```bash
   docker-compose -f docker-compose.fullstack.yml ps
   ```

2. **Expected output**:
   - attendance_db: Running (healthy) on port 3306
   - attendance_backend: Running on port 5000
   - attendance_frontend: Running on port 3000

3. **Test backend API directly**:
   ```bash
   curl http://localhost:5000/api/health
   ```

4. **Test teacher login**:
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"prof.smith@ustp.edu.ph","password":"password123"}'
   ```

5. **Test student login**:
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"alice.doe@student.ustp.edu.ph","password":"password123"}'
   ```

6. **Access web application**:
   Open browser to http://localhost:3000

7. **Test login through web interface**:
   - Teacher login: prof.smith@ustp.edu.ph / password123
   - Student login: alice.doe@student.ustp.edu.ph / password123

## Expected Results

- Backend health check should return: `{"status":"ok","timestamp":"..."}`
- Login requests should return user data with HTTP 200 status
- Web application should load successfully
- Login through web interface should redirect to dashboard

## Troubleshooting

If login fails through web interface:
1. Check frontend logs for proxy errors: `docker logs attendance_frontend`
2. Verify backend is accessible: `curl http://localhost:5000/api/health`
3. Check network connectivity between containers
4. Ensure proxy configuration in vite.config.ts uses correct target (`http://backend:5000`)