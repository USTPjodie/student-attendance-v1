# Docker Setup for Student Attendance System

This guide explains how to run the Student Attendance System using Docker.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose

## Quick Start

1. **Build and start the application:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   Open your browser and navigate to `http://localhost:3000`

3. **Login:**
   - Teacher account: prof.smith@ustp.edu.ph / password123
   - Student account: alice.doe@student.ustp.edu.ph / password123
   - The system automatically detects whether you're a teacher or student based on your account

4. **Stop the application:**
   ```bash
   docker-compose down
   ```

## Docker Configuration

The setup includes two services:

### 1. MySQL Database (db)
- Image: mysql:8.0
- Port: 3306
- Database: student_attendance
- User: appuser
- Password: apppassword

### 2. Application (app)
- Built from the local Dockerfile
- Port: 3000
- Environment variables configured for database connection

## Environment Variables

The following environment variables can be customized in the docker-compose.yml:

- `DB_HOST`: Database host (default: db)
- `DB_PORT`: Database port (default: 3306)
- `DB_USER`: Database user (default: appuser)
- `DB_PASSWORD`: Database password (default: apppassword)
- `DB_NAME`: Database name (default: student_attendance)
- `SESSION_SECRET`: Session secret key (change for production)

## Data Persistence

Data is persisted in a Docker volume named `db_data`. This ensures that your data survives container restarts.

To remove all data:
```bash
docker-compose down -v
```

## Development vs Production

The current setup is configured for development. For production deployment, consider:

1. Changing the SESSION_SECRET to a strong random value
2. Using a more secure database password
3. Adding SSL/TLS for database connections
4. Implementing proper backup strategies
5. Using a reverse proxy like Nginx for SSL termination

## Troubleshooting

### Database Connection Issues
If you see database connection errors:
1. Ensure Docker is running
2. Check that the database service is healthy: `docker-compose ps`
3. Verify environment variables in docker-compose.yml

### Application Not Starting
If the application fails to start:
1. Check the logs: `docker-compose logs app`
2. Ensure all dependencies are properly installed
3. Verify the build process completes successfully

### Accessing the Database
To access the MySQL database directly:
```bash
docker-compose exec db mysql -u appuser -p student_attendance
```

## Customization

### Changing Ports
To use different ports, modify the ports section in docker-compose.yml:
```yaml
ports:
  - "8080:3000"  # Maps host port 8080 to container port 3000
```

### Using External Database
To use an external MySQL database:
1. Remove the db service from docker-compose.yml
2. Update the environment variables for the app service to point to your external database
3. Ensure the external database has the required schema

## Login Process

The login process has been simplified:
- No need to select between teacher or student roles
- The system automatically detects your role based on your account
- Demo credentials:
  - Teacher: prof.smith@ustp.edu.ph / password123
  - Student: alice.doe@student.ustp.edu.ph / password123

## Backup and Restore

### Backup
The database is automatically backed up to a Docker volume. For manual backups:
```bash
docker-compose exec db mysqldump -u appuser -p student_attendance > backup.sql
```

### Restore
To restore from a backup:
```bash
docker-compose exec -T db mysql -u appuser -p student_attendance < backup.sql
```