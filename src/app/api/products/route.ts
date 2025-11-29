import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Product } from "@/types/product";

/**
 * 商品データを取得するAPI
 */
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "products.json");
    const fileContents = fs.readFileSync(filePath, "utf8");
    const products: Product[] = JSON.parse(fileContents);
    return NextResponse.json(products);
  } catch (error) {
    console.error("商品データの読み込みに失敗しました:", error);
    return NextResponse.json([], { status: 500 });
  }
}

