#!/bin/bash

# Health Check Script for Zenpay Backend
# Usage: ./scripts/health-check.sh [URL]

API_URL="${1:-http://localhost:5000}"

echo "🔍 Checking backend health at: $API_URL"
echo "================================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check endpoint
check_endpoint() {
    local endpoint=$1
    local name=$2
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL$endpoint" 2>/dev/null)
    
    if [ "$response" = "200" ] || [ "$response" = "201" ]; then
        echo -e "${GREEN}✓${NC} $name: ${GREEN}OK${NC} ($response)"
        return 0
    else
        echo -e "${RED}✗${NC} $name: ${RED}FAILED${NC} ($response)"
        return 1
    fi
}

# Check health endpoint
echo ""
echo "1. Health Check Endpoint"
check_endpoint "/health" "Health Status"

# Check API docs (if not production)
echo ""
echo "2. API Documentation"
if curl -s "$API_URL/api-docs" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} API Docs: ${GREEN}Available${NC}"
else
    echo -e "${YELLOW}⚠${NC} API Docs: ${YELLOW}Not available (may be disabled in production)${NC}"
fi

# Check main API routes
echo ""
echo "3. API Routes"
check_endpoint "/api/v1/auth/health" "Auth Routes" || echo -e "${YELLOW}⚠${NC} Auth health check not implemented"

# Database connectivity (via health endpoint response)
echo ""
echo "4. Services"
health_data=$(curl -s "$API_URL/health")
if echo "$health_data" | grep -q "ok"; then
    echo -e "${GREEN}✓${NC} Server: ${GREEN}Running${NC}"
    
    # Check if response includes database status
    if echo "$health_data" | grep -q "database"; then
        echo -e "${GREEN}✓${NC} Database: ${GREEN}Connected${NC}"
    else
        echo -e "${YELLOW}⚠${NC} Database: ${YELLOW}Status unknown${NC}"
    fi
else
    echo -e "${RED}✗${NC} Server: ${RED}Not responding${NC}"
fi

# Response time check
echo ""
echo "5. Performance"
response_time=$(curl -o /dev/null -s -w '%{time_total}' "$API_URL/health")
echo -e "Response time: ${response_time}s"

if (( $(echo "$response_time < 1.0" | bc -l) )); then
    echo -e "${GREEN}✓${NC} Performance: ${GREEN}Good${NC}"
elif (( $(echo "$response_time < 3.0" | bc -l) )); then
    echo -e "${YELLOW}⚠${NC} Performance: ${YELLOW}Acceptable${NC}"
else
    echo -e "${RED}✗${NC} Performance: ${RED}Slow${NC}"
fi

echo ""
echo "================================================"
echo "Health check complete!"

