// File: app/api/scrape/route.js
import { NextResponse } from "next/server";
import { scrapeReadable } from "@/lib/scrape";


export const dynamic = "force-dynamic";


export async function GET(req) {
const { searchParams } = new URL(req.url);
const url = searchParams.get("url");
if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });
try {
const data = await scrapeReadable(url);
return NextResponse.json({ data });
} catch (e) {
return NextResponse.json({ error: String(e) }, { status: 500 });
}
}