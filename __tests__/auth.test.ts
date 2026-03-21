/**
 * Test Cases for TC-01: User Registration and Authentication
 *
 * These tests verify the authentication system functionality:
 * - User registration with role support
 * - JWT-based login
 * - Password hashing and validation
 * - Token refresh flow
 * - Protected route access
 */

import { hashPassword, verifyPassword, validatePasswordStrength } from "@/lib/auth/password"
import { generateTokens, verifyAccessToken, verifyRefreshToken } from "@/lib/auth/jwt"

// TC-01.1: Password Hashing Tests
describe("Password Hashing", () => {
  test("should hash password correctly", async () => {
    const password = "TestPassword123!"
    const hashedPassword = await hashPassword(password)

    // Hash should be different from original
    expect(hashedPassword).not.toBe(password)
    // Hash should be a bcrypt hash (starts with $2a$ or $2b$)
    expect(hashedPassword).toMatch(/^\$2[ab]\$/)
  })

  test("should verify correct password", async () => {
    const password = "TestPassword123!"
    const hashedPassword = await hashPassword(password)
    const isValid = await verifyPassword(password, hashedPassword)

    expect(isValid).toBe(true)
  })

  test("should reject incorrect password", async () => {
    const password = "TestPassword123!"
    const wrongPassword = "WrongPassword123!"
    const hashedPassword = await hashPassword(password)
    const isValid = await verifyPassword(wrongPassword, hashedPassword)

    expect(isValid).toBe(false)
  })
})

// TC-01.2: Password Strength Validation Tests
describe("Password Strength Validation", () => {
  test("should reject password shorter than 8 characters", () => {
    const result = validatePasswordStrength("Abc1!@#")
    expect(result.valid).toBe(false)
    expect(result.errors).toContain("Password must be at least 8 characters long")
  })

  test("should reject password without uppercase letter", () => {
    const result = validatePasswordStrength("testpassword123!")
    expect(result.valid).toBe(false)
    expect(result.errors).toContain("Password must contain at least one uppercase letter")
  })

  test("should reject password without lowercase letter", () => {
    const result = validatePasswordStrength("TESTPASSWORD123!")
    expect(result.valid).toBe(false)
    expect(result.errors).toContain("Password must contain at least one lowercase letter")
  })

  test("should reject password without number", () => {
    const result = validatePasswordStrength("TestPassword!")
    expect(result.valid).toBe(false)
    expect(result.errors).toContain("Password must contain at least one number")
  })

  test("should reject password without special character", () => {
    const result = validatePasswordStrength("TestPassword123")
    expect(result.valid).toBe(false)
    expect(result.errors).toContain("Password must contain at least one special character")
  })

  test("should accept valid strong password", () => {
    const result = validatePasswordStrength("TestPassword123!")
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
})

// TC-01.3: JWT Token Tests
describe("JWT Token Management", () => {
  const mockPayload = {
    userId: "test-user-id-123",
    email: "test@example.com",
    role: "traveler" as const,
    firstName: "John",
    lastName: "Doe",
  }

  test("should generate access and refresh tokens", () => {
    const tokens = generateTokens(mockPayload)

    expect(tokens.accessToken).toBeDefined()
    expect(tokens.refreshToken).toBeDefined()
    expect(typeof tokens.accessToken).toBe("string")
    expect(typeof tokens.refreshToken).toBe("string")
  })

  test("should verify valid access token", () => {
    const tokens = generateTokens(mockPayload)
    const payload = verifyAccessToken(tokens.accessToken)

    expect(payload).not.toBeNull()
    expect(payload?.userId).toBe(mockPayload.userId)
    expect(payload?.email).toBe(mockPayload.email)
    expect(payload?.role).toBe(mockPayload.role)
  })

  test("should verify valid refresh token", () => {
    const tokens = generateTokens(mockPayload)
    const payload = verifyRefreshToken(tokens.refreshToken)

    expect(payload).not.toBeNull()
    expect(payload?.userId).toBe(mockPayload.userId)
  })

  test("should reject invalid access token", () => {
    const payload = verifyAccessToken("invalid-token")
    expect(payload).toBeNull()
  })

  test("should reject invalid refresh token", () => {
    const payload = verifyRefreshToken("invalid-token")
    expect(payload).toBeNull()
  })
})

// TC-01.4: Role Support Tests
describe("Role Support", () => {
  const roles = ["traveler", "guide", "company", "admin"] as const

  roles.forEach((role) => {
    test(`should generate token with ${role} role`, () => {
      const payload = {
        userId: "test-user-id",
        email: "test@example.com",
        role,
        firstName: "Test",
        lastName: "User",
      }
      const tokens = generateTokens(payload)
      const verified = verifyAccessToken(tokens.accessToken)

      expect(verified?.role).toBe(role)
    })
  })
})
