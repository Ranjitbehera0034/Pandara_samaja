#!/bin/bash
BASE_URL="http://localhost:5000/api/portal"
echo "Testing ALL expected frontend endpoints against the backend..."
echo ""

check_endpoint() {
    local method=$1
    local path=$2
    local label=$3
    # We use -s for silent and output only the HTTP status code
    local status=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$BASE_URL$path")
    
    # 401 means "Unauthorized" (the endpoint exists, but we didn't send a token)
    # 400 means "Bad Request" (the endpoint exists, but we didn't send right body)
    # 404 means "Not Found" (the endpoint DOES NOT EXIST on the backend)
    # 405 means "Method Not Allowed" (the path exists but wrong HTTP method GET vs POST)
    
    if [ "$status" = "401" ] || [ "$status" = "400" ] || [ "$status" = "200" ] || [ "$status" = "201" ]; then
        echo "✅ EXIST: $method $path ($label)"
    else
        echo "❌ MISSING (Got $status): $method $path ($label)"
    fi
}

echo "--- 1. Authentication & Profile ---"
check_endpoint "POST" "/login" "Login"
check_endpoint "GET" "/me" "Get My Profile"
check_endpoint "PUT" "/profile" "Update Profile"
check_endpoint "POST" "/profile/photo" "Upload Profile Photo"

echo ""
echo "--- 2. Members Directory ---"
check_endpoint "GET" "/members" "List All Members"
check_endpoint "GET" "/members/123" "Get Specific Member Profile"
check_endpoint "POST" "/subscribe/123" "Subscribe to Member"

echo ""
echo "--- 3. Social Feed (Posts) ---"
check_endpoint "GET" "/posts" "Get All Posts"
check_endpoint "POST" "/posts" "Create Post"
check_endpoint "PUT" "/posts/123" "Edit Post"
check_endpoint "DELETE" "/posts/123" "Delete Post"
check_endpoint "POST" "/posts/123/like" "Like Post"
check_endpoint "POST" "/posts/123/comments" "Comment on Post"
check_endpoint "POST" "/posts/123/report" "Report Post"

echo ""
echo "--- 4. Gallery ---"
check_endpoint "GET" "/photos" "Get Photos"
check_endpoint "POST" "/photos" "Upload Photo"
check_endpoint "DELETE" "/photos/123" "Delete Photo"

echo ""
echo "--- 5. Chat System ---"
check_endpoint "GET" "/chat/contacts" "Get Contacts"
check_endpoint "GET" "/chat/conversation/123" "Get Conversation"
check_endpoint "PUT" "/chat/read/123" "Mark Messages Read"

echo ""
echo "--- 6. Notifications ---"
check_endpoint "GET" "/notifications" "Get Notifications"
check_endpoint "GET" "/notifications/unread-count" "Unread Count"
check_endpoint "PUT" "/notifications/read-all" "Mark All Read"
check_endpoint "PUT" "/notifications/123/read" "Mark Single Read"

echo ""
echo "--- 7. Family Hub (Newly Added Phase 6) ---"
check_endpoint "GET" "/family/albums" "Get Family Albums"
check_endpoint "POST" "/family/albums" "Create Family Album"
check_endpoint "GET" "/family/events" "Get Family Events"
check_endpoint "POST" "/family/events" "Create Family Event"
check_endpoint "GET" "/family/accounts" "Get Sub-Accounts"
check_endpoint "POST" "/family/accounts" "Create Sub-Account"
# Note: Family Tree uses the /me endpoint's family_members array so it doesn't strictly need a new API

echo ""
echo "--- 8. Community (Phases 4 & 5 Mocked Data) ---"
check_endpoint "GET" "/events" "Get Community Events"
check_endpoint "GET" "/groups" "Get Community Groups"
check_endpoint "GET" "/explore/stats" "Get Explore Stats"
check_endpoint "GET" "/live/streams" "Get Active Streams"

