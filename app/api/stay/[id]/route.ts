import { NextRequest, NextResponse } from "next/server";
import { loadStay } from "@/lib/stays";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const stay = loadStay(id);
  if (!stay) {
    return NextResponse.json({ error: `Stay "${id}" not found` }, { status: 404 });
  }
  return NextResponse.json(stay);
}
