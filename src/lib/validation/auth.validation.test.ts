import { describe, it, expect } from 'vitest';
import {
  signUpSchema,
  signInSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.validation';

describe('Auth Validation', () => {
  describe('signUpSchema', () => {
    it('should validate valid sign up payload', () => {
      const payload = {
        email: 'test@example.com',
        password: 'Test123!@#',
        confirmPassword: 'Test123!@#',
        displayName: 'Test User',
      };
      const result = signUpSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should reject when passwords don't match", () => {
      const payload = {
        email: 'test@example.com',
        password: 'Test123!@#',
        confirmPassword: 'Different123!',
        displayName: 'Test User',
      };
      const result = signUpSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('do not match');
      }
    });

    it('should reject invalid email in sign up', () => {
      const payload = {
        email: 'notanemail',
        password: 'Test123!@#',
        confirmPassword: 'Test123!@#',
        displayName: 'Test User',
      };
      const result = signUpSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject password shorter than 8 characters', () => {
      const payload = {
        email: 'test@example.com',
        password: 'Test12!',
        confirmPassword: 'Test12!',
        displayName: 'Test User',
      };
      const result = signUpSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject password without uppercase letter', () => {
      const payload = {
        email: 'test@example.com',
        password: 'test123!@#',
        confirmPassword: 'test123!@#',
        displayName: 'Test User',
      };
      const result = signUpSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject password without lowercase letter', () => {
      const payload = {
        email: 'test@example.com',
        password: 'TEST123!@#',
        confirmPassword: 'TEST123!@#',
        displayName: 'Test User',
      };
      const result = signUpSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject password without number', () => {
      const payload = {
        email: 'test@example.com',
        password: 'TestTest!@#',
        confirmPassword: 'TestTest!@#',
        displayName: 'Test User',
      };
      const result = signUpSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should accept sign up without display name', () => {
      const payload = {
        email: 'test@example.com',
        password: 'Test123!@#',
        confirmPassword: 'Test123!@#',
      };
      const result = signUpSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });
  });

  describe('signInSchema', () => {
    it('should validate valid sign in payload', () => {
      const payload = {
        email: 'test@example.com',
        password: 'Test123!@#',
      };
      const result = signInSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should reject missing email', () => {
      const payload = {
        email: '',
        password: 'Test123!@#',
      };
      const result = signInSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject invalid email format', () => {
      const payload = {
        email: 'notanemail',
        password: 'Test123!@#',
      };
      const result = signInSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject missing password', () => {
      const payload = {
        email: 'test@example.com',
        password: '',
      };
      const result = signInSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('forgotPasswordSchema', () => {
    it('should validate valid email for password reset', () => {
      const result = forgotPasswordSchema.safeParse({
        email: 'test@example.com',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const result = forgotPasswordSchema.safeParse({ email: 'notanemail' });
      expect(result.success).toBe(false);
    });

    it('should reject empty email', () => {
      const result = forgotPasswordSchema.safeParse({ email: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('resetPasswordSchema', () => {
    it('should validate valid reset password payload', () => {
      const payload = {
        password: 'NewPass123!',
        confirmPassword: 'NewPass123!',
      };
      const result = resetPasswordSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("should reject when passwords don't match", () => {
      const payload = {
        password: 'NewPass123!',
        confirmPassword: 'Different123!',
      };
      const result = resetPasswordSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('do not match');
      }
    });

    it('should reject weak password in reset', () => {
      const payload = {
        password: 'weak',
        confirmPassword: 'weak',
      };
      const result = resetPasswordSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject password without uppercase', () => {
      const payload = {
        password: 'newpass123!',
        confirmPassword: 'newpass123!',
      };
      const result = resetPasswordSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject password without number', () => {
      const payload = {
        password: 'NewPassword!',
        confirmPassword: 'NewPassword!',
      };
      const result = resetPasswordSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });
});
