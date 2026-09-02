import type { NextRequest } from "next/server";
import getMongoClient from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (
    !cronSecret ||
    request.headers.get("authorization") !== `Bearer ${cronSecret}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const client = await getMongoClient();
    await client.db("neptune-collection").command({ ping: 1 });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Keep-alive MongoDB en échec:", error);

    return Response.json({ ok: false }, { status: 500 });
  }
}
