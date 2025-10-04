@echo off
echo Stopping Docker containers...
docker-compose -f docker-compose.final.yml down

echo Removing Docker volumes...
docker-compose -f docker-compose.final.yml down -v

echo Building and starting Docker containers...
docker-compose -f docker-compose.final.yml up --build

echo Docker environment reset complete!
pause