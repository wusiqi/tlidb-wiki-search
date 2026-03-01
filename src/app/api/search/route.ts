import { NextRequest, NextResponse } from "next/server";
import { searchWiki } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query || !query.trim()) {
    return NextResponse.json({ error: "需要参数 q" }, { status: 400 });
  }
  try {
    const result = await searchWiki(query.trim());
    return NextResponse.json(result);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "搜索失败" }, { status: 500 });
  }
}
