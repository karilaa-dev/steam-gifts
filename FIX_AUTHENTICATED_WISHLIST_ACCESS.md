# Fix Authenticated Wishlist Access

## Problem
The system is not properly using the authenticated Steam session to access private wishlists of friends. The current implementation fails when a friend's wishlist is private because it's only trying public access.

## Solution
1. **Update client-side** to include Steam authentication cookies in requests
2. **Verify backend** correctly handles authenticated access
3. **Test the complete flow**

## Changes Needed

### 1. Update Client-Side Requests to Include Credentials
The client needs to include cookies (including Steam authentication) in the fetch requests.

### 2. Verify Backend Authentication Flow
The backend already has the logic for authenticated access, but we need to ensure Steam cookies are being passed through.

### 3. Test End-to-End Flow
Verify that authenticated users can access their friends' private wishlists.

## Files to Modify
- `src/client/App.tsx` - Add credentials to fetch requests
- `src/client/components/FriendSelector.tsx` - Ensure consistent cookie handling
- Test the complete flow

## Expected Behavior
When a friend has a private wishlist, the system should:
1. First try public access (fail)
2. Detect the user is authenticated
3. Use the authenticated Steam session to access the wishlist
4. Successfully load the friend's wishlist