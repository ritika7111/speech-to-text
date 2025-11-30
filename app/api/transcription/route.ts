import { connectDB } from "@/lib/mongodb";
import Transcription from "@/models/Transcription";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { audioUrl } = await req.json();

    if (!audioUrl) {
      return Response.json(
        { success: false, error: "audioUrl is required" },
        { status: 400 }
      );
    }

    // ------------------------------
    // Mock "download audio" step
    // ------------------------------
    console.log("Mock downloading audio from:", audioUrl);

    // ------------------------------
    // Mock transcription
    // ------------------------------
    const transcriptionText = "transcribed text";

    // ------------------------------
    // Save into MongoDB
    // ------------------------------
    const record = await Transcription.create({
      audioUrl,
      transcription: transcriptionText,
      createdAt: new Date(),
    });

    // ------------------------------
    // Return only the _id
    // ------------------------------
    return Response.json({
      success: true,
      id: record._id,
    });
  } catch (error: any) {
    console.log("error", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Query records created within last 30 days
    const records = await Transcription.find({
      createdAt: { $gte: thirtyDaysAgo },
    }).sort({ createdAt: -1 });

    return Response.json({
      success: true,
      data: records,
    });
  } catch (error: any) {
    console.log("error", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}


