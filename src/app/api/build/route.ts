import { NextResponse } from "next/server";
import { buildDataset } from "@/lib/dataset";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // allow up to 2 min

export async function POST() {
  try {
    const status = await buildDataset();
    return NextResponse.json(status);
  } catch (error) {
    console.error("Build error:", error);
    return NextResponse.json({ ok: false, error: "构建失败" }, { status: 500 });
  }
}
