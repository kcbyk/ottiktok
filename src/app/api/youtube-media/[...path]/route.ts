import { NextRequest, NextResponse } from "next/server";

const RAPIDAPI_HOST = "youtube-media-downloader.p.rapidapi.com";
// Use the provided API key for now, or from environment variable
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY_YOUTUBE_MEDIA || "f890c11bc2msh5d052433c7ad0d5p15925djsn5a5f8b7a00a3";

export async function GET(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: pathParams } = await props.params;
    // Build the path from the params
    const path = pathParams.join("/");
    // Get the search params from the request
    const searchParams = req.nextUrl.searchParams.toString();
    const fullUrl = `https://${RAPIDAPI_HOST}/${path}${searchParams ? `?${searchParams}` : ""}`;

    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": RAPIDAPI_HOST,
        "x-rapidapi-key": RAPIDAPI_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `API request failed: ${response.status} ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("YouTube Media API Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// Also support POST requests if needed
export async function POST(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: pathParams } = await props.params;
    const path = pathParams.join("/");
    const fullUrl = `https://${RAPIDAPI_HOST}/${path}`;
    const body = await req.json();

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": RAPIDAPI_HOST,
        "x-rapidapi-key": RAPIDAPI_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `API request failed: ${response.status} ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("YouTube Media API Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
