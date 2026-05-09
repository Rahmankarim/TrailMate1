import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db/mongodb"
import { hashPassword } from "@/lib/auth/password"
import { generateTokens } from "@/lib/auth/jwt"
import { setAuthCookies } from "@/lib/auth/cookies"
import type { AuthResponse, User } from "@/lib/auth/types"

const ADMIN_EMAIL = (process.env.ADMIN_LOGIN_EMAIL ?? "rahmankarrim2468@gmail.com").toLowerCase()
const ADMIN_PASSWORD = process.env.ADMIN_LOGIN_PASSWORD ?? "Rk7150250084365?"
const ADMIN_FIRST_NAME = process.env.ADMIN_LOGIN_FIRST_NAME ?? "Admin"
const ADMIN_LAST_NAME = process.env.ADMIN_LOGIN_LAST_NAME ?? "User"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = String(body?.email ?? "").toLowerCase().trim()
    const password = String(body?.password ?? "")

    if (!email || !password) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: "Email and password are required",
        },
        { status: 400 },
      )
    }

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: "Invalid admin credentials",
        },
        { status: 401 },
      )
    }

    const usersCollection = await getCollection<User>("users")
    const now = new Date()
    const hashedPassword = await hashPassword(ADMIN_PASSWORD)

    const existingAdmin = await usersCollection.findOne({ email: ADMIN_EMAIL })

    let adminUser: User

    if (!existingAdmin) {
      adminUser = {
        email: ADMIN_EMAIL,
        password: hashedPassword,
        firstName: ADMIN_FIRST_NAME,
        lastName: ADMIN_LAST_NAME,
        role: "admin",
        isVerified: true,
        isActive: true,
        refreshTokens: [],
        authProvider: "local",
        createdAt: now,
        updatedAt: now,
      }

      const insertResult = await usersCollection.insertOne(adminUser)
      adminUser = {
        ...adminUser,
        _id: insertResult.insertedId,
      }
    } else {
      await usersCollection.updateOne(
        { email: ADMIN_EMAIL },
        {
          $set: {
            password: hashedPassword,
            firstName: existingAdmin.firstName || ADMIN_FIRST_NAME,
            lastName: existingAdmin.lastName || ADMIN_LAST_NAME,
            role: "admin",
            isVerified: true,
            isActive: true,
            authProvider: "local",
            updatedAt: now,
          },
        },
      )

      adminUser = {
        ...existingAdmin,
        password: hashedPassword,
        firstName: existingAdmin.firstName || ADMIN_FIRST_NAME,
        lastName: existingAdmin.lastName || ADMIN_LAST_NAME,
        role: "admin",
        isVerified: true,
        isActive: true,
        authProvider: "local",
        updatedAt: now,
      }
    }

    const tokens = generateTokens({
      userId: adminUser._id?.toString() ?? existingAdmin?._id?.toString() ?? "",
      email: adminUser.email,
      role: "admin",
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
    })

    await usersCollection.updateOne(
      { email: ADMIN_EMAIL },
      {
        $set: {
          refreshTokens: [...(existingAdmin?.refreshTokens || []), tokens.refreshToken].slice(-5),
          lastLogin: now,
          updatedAt: now,
        },
      },
    )

    await setAuthCookies(tokens.accessToken, tokens.refreshToken)

    const userWithoutSensitive = {
      ...adminUser,
      password: undefined,
      refreshTokens: undefined,
    }

    return NextResponse.json<AuthResponse>(
      {
        success: true,
        message: "Admin signed in successfully",
        user: userWithoutSensitive,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Admin signin error:", error)
    return NextResponse.json<AuthResponse>(
      {
        success: false,
        message: "An error occurred during admin signin",
      },
      { status: 500 },
    )
  }
}