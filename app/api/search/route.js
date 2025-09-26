// File: app/api/search/route.js
import { NextResponse } from "next/server";
import { webSearch } from "@/lib/search";


export const dynamic = "force-dynamic";


export async function GET(req) {
const { searchParams } = new URL(req.url);
const q = searchParams.get("q") || "";
if (!q) return NextResponse.json({ results: [] });
const results = await webSearch(q);
return NextResponse.json({ results });
}