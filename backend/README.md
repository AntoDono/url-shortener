# URL Shortener API

A RESTful API for a URL shortener service with user authentication and session management.

## Setup

1. Clone the repository
2. Navigate to the backend directory
3. Install dependencies:
   ```
   npm install
   ```
4. Set up your environment variables in `.env`:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   DECODE_KEY=your_strong_encryption_key
   PORT=3001
   ```
5. Start the server:
   ```
   npm run dev
   ```

## API Endpoints

### Authentication

#### POST /signup
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "created_at": "2023-01-01T00:00:00Z"
}
```

#### POST /login
Log in and get a session key.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "created_at": "2023-01-01T00:00:00Z"
  },
  "sessionKey": "your_session_key",
  "message": "Login successful"
}
```

#### POST /logout
Log out and invalidate the session key.

**Headers:**
```
Authorization: session_key
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

#### GET /session
Check if the current session is valid.

**Headers:**
```
Authorization: session_key
```

**Response:**
```json
{
  "authenticated": true,
  "userId": "user_id"
}
```

### Links

#### POST /get-links
Get all links for the authenticated user.

**Headers:**
```
Authorization: session_key
```

**Response:**
```json
[
  {
    "id": "link_id",
    "user_id": "user_id",
    "url": "https://example.com",
    "alias": "abc123",
    "created_at": "2023-01-01T00:00:00Z",
    "accessed": 42
  }
]
```

#### POST /links
Create a new link.

**Headers:**
```
Authorization: session_key
```

**Request Body:**
```json
{
  "url": "https://example.com",
  "alias": "abc123"
}
```

**Response:**
```json
{
  "id": "link_id",
  "user_id": "user_id",
  "url": "https://example.com",
  "alias": "abc123",
  "created_at": "2023-01-01T00:00:00Z",
  "accessed": 0
}
```

#### PUT /links/:id
Update a link.

**Headers:**
```
Authorization: session_key
```

**Request Body:**
```json
{
  "url": "https://updated-example.com",
  "alias": "xyz789"
}
```

**Response:**
```json
{
  "id": "link_id",
  "user_id": "user_id",
  "url": "https://updated-example.com",
  "alias": "xyz789",
  "created_at": "2023-01-01T00:00:00Z"
}
```

#### DELETE /links/:id
Delete a link.

**Headers:**
```
Authorization: session_key
```

**Response:**
```
204 No Content
```

#### POST /create-link
Create a new shortened URL with an optional custom alias.

**Headers:**
```
Authorization: session_key
```

**Request Body:**
```json
{
  "url": "https://example.com",
  "custom_alias": "custom-name"  // Optional
}
```

**Response:**
```json
{
  "id": "link_id",
  "user_id": "user_id",
  "url": "https://example.com",
  "alias": "custom-name",
  "created_at": "2023-01-01T00:00:00Z",
  "accessed": 0
}
```

#### GET /r/:alias
Redirect to the original URL. This endpoint is public (no authentication required).

**Example:**
```
/r/abc123
```

**Response:**
Redirects to the original URL associated with the alias.

#### GET /link-stats/:alias
Get statistics for a specific shortened URL.

**Headers:**
```
Authorization: session_key
```

**Example:**
```
/link-stats/abc123
```

**Response:**
```json
{
  "id": "link_id",
  "url": "https://example.com",
  "alias": "abc123",
  "accessed": 42,
  "created_at": "2023-01-01T00:00:00Z"
}
```

### Users

Additional endpoints for user management are available but require authentication. 