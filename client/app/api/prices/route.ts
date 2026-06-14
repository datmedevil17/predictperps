import { getPriceSnapshot } from "@/app/lib/server/priceFeed";

export async function GET() {
  return Response.json(getPriceSnapshot());
}
