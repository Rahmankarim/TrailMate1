import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { verifyAccessToken } from "@/lib/auth/jwt"
import { cookies } from "next/headers"
import { ObjectId } from "mongodb"

export interface BankAccount {
  _id?: string
  bankName: string
  accountTitle: string
  accountNumber: string
  iban?: string
  branchCode?: string
  createdAt: Date
  updatedAt: Date
}

// GET - Fetch bank accounts
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("access_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyAccessToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    const user = await usersCollection.findOne({ _id: new ObjectId(payload.userId) })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const bankAccounts = user.bankAccounts || []

    return NextResponse.json({ 
      success: true,
      bankAccounts: bankAccounts.map((account: any) => ({
        ...account,
        _id: account._id?.toString() || new ObjectId().toString()
      }))
    })
  } catch (error) {
    console.error("Error fetching bank accounts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Add new bank account
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("access_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyAccessToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { bankName, accountTitle, accountNumber, iban, branchCode } = body

    if (!bankName || !accountTitle || !accountNumber) {
      return NextResponse.json({ 
        error: "Bank name, account title, and account number are required" 
      }, { status: 400 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    const newAccount: BankAccount = {
      _id: new ObjectId().toString(),
      bankName,
      accountTitle,
      accountNumber,
      iban: iban || "",
      branchCode: branchCode || "",
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(payload.userId) },
      { 
        $push: { bankAccounts: newAccount },
        $set: { updatedAt: new Date() }
      }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Failed to add bank account" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: "Bank account added successfully",
      bankAccount: newAccount
    })
  } catch (error) {
    console.error("Error adding bank account:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update bank account
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("access_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyAccessToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { accountId, bankName, accountTitle, accountNumber, iban, branchCode } = body

    if (!accountId) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    const updateFields: any = {
      "bankAccounts.$.updatedAt": new Date()
    }

    if (bankName) updateFields["bankAccounts.$.bankName"] = bankName
    if (accountTitle) updateFields["bankAccounts.$.accountTitle"] = accountTitle
    if (accountNumber) updateFields["bankAccounts.$.accountNumber"] = accountNumber
    if (iban !== undefined) updateFields["bankAccounts.$.iban"] = iban
    if (branchCode !== undefined) updateFields["bankAccounts.$.branchCode"] = branchCode

    const result = await usersCollection.updateOne(
      { 
        _id: new ObjectId(payload.userId),
        "bankAccounts._id": accountId
      },
      { $set: updateFields }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Bank account not found or no changes made" }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      message: "Bank account updated successfully"
    })
  } catch (error) {
    console.error("Error updating bank account:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Remove bank account
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("access_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyAccessToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get("accountId")

    if (!accountId) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(payload.userId) },
      { 
        $pull: { bankAccounts: { _id: accountId } },
        $set: { updatedAt: new Date() }
      }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Bank account not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      message: "Bank account deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting bank account:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
