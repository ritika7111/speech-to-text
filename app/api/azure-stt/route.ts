import { NextResponse } from "next/server";
import AzureTranscription from "@/models/AzureTranscription";
import { connectDB } from "@/lib/mongodb";
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const audio = form.get("audio") as Blob;
    const language = "en-US";
    await connectDB();
    if (!audio) {
      return NextResponse.json({ error: "Audio missing" }, { status: 400 });
    }

    if (!process.env.AZURE_SPEECH_KEY) {
      return NextResponse.json(
        { error: "Missing AZURE_SPEECH_KEY" },
        { status: 500 }
      );
    }

    // Convert blob to buffer
    const buffer = Buffer.from(await audio.arrayBuffer());

    // Determine proper Content-Type for Azure
    const inputType = (audio.type || "audio/wav").toLowerCase();
    let contentType = inputType;
    if (inputType.startsWith("audio/webm")) {
      contentType = "audio/webm; codecs=opus";
    } else if (inputType.startsWith("audio/ogg")) {
      contentType = "audio/ogg; codecs=opus";
    } else if (inputType.startsWith("audio/wav")) {
      contentType = "audio/wav; codecs=audio/pcm";
    }

    const region = process.env.AZURE_SPEECH_REGION || "centralindia";
    const url = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${language}&format=detailed`;

    const azureRes = await fetch(url, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.AZURE_SPEECH_KEY!,
        "Content-Type": contentType,
        Accept: "application/json; charset=utf-8",
      },
      body: buffer,
    });

    if (!azureRes.ok) {
      const errText = await azureRes.text();
      return NextResponse.json(
        { error: "Azure STT request failed", details: errText },
        { status: azureRes.status }
      );
    }

    const data = await azureRes.json();

    const displayText =
      data?.DisplayText ||
      data?.NBest?.[0]?.Display ||
      data?.NBest?.[0]?.Lexical ||
      "";

    const fileName = (audio as any)?.name || "upload";
    const record = await AzureTranscription.create({
      audioUrl: fileName,
      transcription: displayText,
      language,
      source: "azure",
      createdAt: new Date(),
    });

    // Step 4: Return response
    return NextResponse.json({
      success: true,
      id: record._id,
      DisplayText: displayText,
      raw: data,
    });
  } catch (error) {
    console.error("Azure STT Error:", error);
    return NextResponse.json({ error: "STT failed" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.max(parseInt(searchParams.get("limit") || "10", 10), 1);
    const skip = (page - 1) * limit;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const filter = { createdAt: { $gte: thirtyDaysAgo } };
    const total = await AzureTranscription.countDocuments(filter);
    const records = await AzureTranscription.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: records,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to load Azure transcriptions" },
      { status: 500 }
    );
  }
}
