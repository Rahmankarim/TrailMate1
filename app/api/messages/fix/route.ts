import { NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db/mongodb"

export async function POST(request: NextRequest) {
  try {
    const messagesCollection = await getCollection("messages")
    
    // Update all messages from old guide ID to new guide ID
    const result = await messagesCollection.updateMany(
      { guideId: "69753774b3aed159a747d23c" },
      { $set: { guideId: "69752e93e27dbe87b20476f1" } }
    )

    return NextResponse.json({
      success: true,
      updated: result.modifiedCount,
      message: `Updated ${result.modifiedCount} messages to correct guide ID`
    })
  } catch (error) {
    console.error("Error fixing messages:", error)
    return NextResponse.json(
      { error: "Failed to fix messages" },
      { status: 500 }
    )
  }
}
