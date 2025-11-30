import { NextRequest, NextResponse } from 'next/server';

/**
 * 価格アラート受付API
 * POST /api/alert
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { asin, targetPrice, email } = body;

    // バリデーション
    if (!asin || !targetPrice || !email) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // ターゲット価格のチェック
    if (typeof targetPrice !== 'number' || targetPrice <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid target price' },
        { status: 400 }
      );
    }

    // モック機能：本番環境では実際の通知サービスに接続
    // 開発環境でのみログ出力（必要に応じて実装）
    if (process.env.NODE_ENV === 'development') {
      // 開発環境でのみログ出力
    }

    // 成功レスポンス
    return NextResponse.json({
      success: true,
      message: `Alert set for ${asin}`,
      data: {
        asin,
        targetPrice,
        email,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Alert API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

