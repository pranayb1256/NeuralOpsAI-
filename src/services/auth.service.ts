// src/services/auth.service.ts
import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import prisma from '../infrastructure/database/prisma.client';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-fallback-do-not-use-in-prod';
const JWT_EXPIRES_IN = '1h';

export class AuthService {
  
  /**
   * Registers a new user with an Argon2 hashed password
   */
  static async registerUser(email: string, passwordPlain: string, name: string) {
    // 1. Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // 2. Hash the password using Argon2id (default in the argon2 package)
    // We can tune memoryCost and timeCost if we are on heavy server infrastructure
    const passwordHash = await argon2.hash(passwordPlain, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB RAM per hash
      timeCost: 3,         // 3 iterations
      parallelism: 1,      // 1 thread
    });

    // 3. Save to database
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
      },
    });

    // 4. Generate Token
    const token = this.generateToken(user.id, user.role);

    return { user: { id: user.id, email: user.email, name: user.name }, token };
  }

  /**
   * Authenticates a user and issues a JWT
   */
  static async loginUser(email: string, passwordPlain: string) {
    // 1. Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials'); // Never reveal if it was the email or password that failed
    }

    // 2. Verify Argon2 hash
    const isValid = await argon2.verify(user.passwordHash, passwordPlain);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // 3. Generate Token
    const token = this.generateToken(user.id, user.role);

    return { user: { id: user.id, email: user.email }, token };
  }

  /**
   * Private helper to sign JWTs
   */
  private static generateToken(userId: string, role: string): string {
    return jwt.sign(
      { userId, role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN, algorithm: 'HS256' } // HMAC with SHA-256
    );
  }
}
