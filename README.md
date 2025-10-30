# re-jwt-express

A lightweight and type-safe JWT authentication library for Express.js applications.

## Features

- 🔒 Secure JWT token generation and validation
- 🔑 Support for both cookie-based and header-based authentication
- 📝 TypeScript support with full type definitions
- 🚀 Simple API for Express middleware integration
- ⏰ Built-in token expiration handling

## Installation

```bash
npm install re-jwt-express
```

## Quick Start

```typescript
import express from 'express';
import cookieParser from 'cookie-parser';
import { authenticate, generateTokens } from 're-jwt-express';

const app = express();
app.use(express.json());
app.use(cookieParser());

const JWT_SECRET = 'your-secret-key'; // Store this securely in environment variables

// Login route - generate and send token
app.post('/login', (req, res) => {
  // Validate user credentials (example)
  const { username, password } = req.body;
  
  // In a real app, you would verify against a database
  if (username === 'user' && password === 'password') {
    // Create payload with user data
    const userPayload = { 
      id: '123', 
      username: username,
      role: 'user'
    };
    
    // Generate JWT token
    const token = generateTokens(userPayload, { 
      secret: JWT_SECRET,
      expiresIn: '1h' // Token expires in 1 hour
    });
    
    // Send token in cookie
    res.cookie('auth_token', token, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      maxAge: 3600000 // 1 hour in milliseconds
    });
    
    res.json({ success: true, message: 'Login successful' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Protected route using cookie authentication
app.get('/profile', 
  authenticate({
    mode: 'cookie',
    tokenCookieName: 'auth_token',
    secret: JWT_SECRET
  }),
  (req, res) => {
    // req.user contains the decoded token payload
    res.json({ 
      message: 'Protected profile data', 
      user: req.user 
    });
  }
);

// Start server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Authentication Methods

### Cookie-based Authentication

```typescript
// Middleware for cookie-based authentication
app.use('/api/protected',
  authenticate({
    mode: 'cookie',
    tokenCookieName: 'auth_token', // Name of the cookie containing the token
    secret: JWT_SECRET
  })
);
```

### Header-based Authentication

```typescript
// Middleware for header-based authentication
app.use('/api/protected',
  authenticate({
    mode: 'header',
    headerName: 'authorization', // Default header name (case-insensitive)
    secret: JWT_SECRET
  })
);

// Usage with header:
// Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## API Reference

### `generateTokens(payload, options)`

Generates a JWT token with the provided payload and options.

**Parameters:**
- `payload` (object): Data to be encoded in the token
- `options` (object): JWT sign options plus secret
  - `secret` (string): Secret key for signing the token
  - `expiresIn` (string | number): Token expiration time (e.g., '1h', '7d', 3600)
  - Other standard jsonwebtoken sign options are supported

**Returns:**
- `string`: The generated JWT token

### `authenticate(options)`

Creates an Express middleware function that authenticates requests using JWT.

**Parameters:**
- `options` (object): Authentication configuration
  - For cookie-based auth:
    - `mode`: 'cookie'
    - `tokenCookieName`: Name of the cookie containing the token
    - `secret`: Secret key for verifying the token
  - For header-based auth:
    - `mode`: 'header'
    - `headerName`: Name of the header containing the token
    - `secret`: Secret key for verifying the token

**Returns:**
- Express middleware function that:
  - Validates the token
  - Sets `req.user` with the decoded payload if valid
  - Returns 401 error responses for invalid/expired tokens

### `validateToken(token, secret)`

Validates a JWT token and returns its status and payload.

**Parameters:**
- `token` (string): The JWT token to validate
- `secret` (string): Secret key for verifying the token

**Returns:**
- Object with:
  - `status`: 'VALID', 'EXPIRED', or 'INVALID'
  - `payload`: Decoded token payload (if valid) or null (if expired/invalid)

## TypeScript Support

The library includes full TypeScript support. You can specify the payload type for better type safety:

```typescript
interface UserPayload {
  id: string;
  username: string;
  role: string;
}

// When generating tokens
const token = generateTokens<UserPayload>({ 
  id: '123', 
  username: 'user',
  role: 'admin'
}, { 
  secret: JWT_SECRET,
  expiresIn: '1h' 
});

// When using authenticate middleware
app.get('/admin', 
  authenticate<UserPayload>({
    mode: 'cookie',
    tokenCookieName: 'auth_token',
    secret: JWT_SECRET
  }),
  (req, res) => {
    // req.user is typed as UserPayload
    if (req.user?.role === 'admin') {
      res.json({ message: 'Admin dashboard data' });
    } else {
      res.status(403).json({ message: 'Access denied' });
    }
  }
);
```

## Security Best Practices

1. **Store secrets securely**: Never hardcode your JWT secret in your code. Use environment variables.
2. **Use HTTPS**: Always use HTTPS in production to protect tokens in transit.
3. **Set appropriate expiration**: Use short-lived tokens and implement refresh token strategies for long sessions.
4. **Use httpOnly cookies**: When using cookie-based auth, always set the httpOnly flag to prevent JavaScript access.
5. **Implement CSRF protection**: For cookie-based authentication, implement CSRF protection.

## License

MIT