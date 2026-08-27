import { AUDIO_URL } from "@/lib/config/env";

export async function GET() {
  try {
    const response = await fetch(`${AUDIO_URL}/audio/latest`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return Response.json(
        { detail: response.status === 404 ? "No audio available" : "Audio service unavailable" },
        { status: response.status }
      );
    }

    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "audio/mpeg",
      },
    });
  } catch {
    return Response.json({ detail: "Could not reach the audio device service" }, { status: 502 });
  }
}
