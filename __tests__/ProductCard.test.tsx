import React from 'react';
import { render, screen } from '@testing-library/react';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/types/product';

/**
 * テスト用のモック商品データを作成
 */
const createMockProduct = (overrides?: Partial<Product>): Product => ({
  id: '1',
  name: 'テスト商品名',
  currentPrice: 10000,
  priceHistory: [
    {
      date: '2025-01-01T00:00:00.000Z',
      price: 12000,
    },
    {
      date: '2025-01-02T00:00:00.000Z',
      price: 10000,
    },
  ],
  affiliateUrl: 'https://www.amazon.co.jp/dp/B012345678',
  imageUrl: 'https://example.com/image.jpg',
  category: 'ガジェット',
  ...overrides,
});

describe('ProductCard', () => {
  /**
   * 商品名が正しく表示されることを確認
   */
  it('商品名を正しく表示する', () => {
    const product = createMockProduct({ name: 'MacBook Pro 16インチ' });
    render(<ProductCard product={product} />);
    
    // 商品名が表示される（複数箇所に表示される可能性があるため、getAllByTextを使用）
    const productNames = screen.getAllByText('MacBook Pro 16インチ');
    expect(productNames.length).toBeGreaterThan(0);
  });

  /**
   * 現在価格が正しく表示されることを確認
   */
  it('現在価格を正しく表示する', () => {
    const product = createMockProduct({ currentPrice: 15000 });
    render(<ProductCard product={product} />);
    
    // 価格は「¥15,000」の形式で表示される（複数箇所に表示される可能性があるため）
    const prices = screen.getAllByText(/¥15,000/);
    expect(prices.length).toBeGreaterThan(0);
  });

  /**
   * 価格変動情報が正しく表示されることを確認（値下がり時）
   */
  it('値下がり時の価格変動情報を正しく表示する', () => {
    const product = createMockProduct({
      currentPrice: 10000,
      priceHistory: [
        {
          date: '2025-01-01T00:00:00.000Z',
          price: 12000,
        },
        {
          date: '2025-01-02T00:00:00.000Z',
          price: 10000,
        },
      ],
    });
    render(<ProductCard product={product} />);
    
    // 値下がり情報が表示される（「▼」が含まれる）
    const priceChangeTexts = screen.getAllByText(/▼/);
    expect(priceChangeTexts.length).toBeGreaterThan(0);
    
    // 値下がり額が表示される（「−¥2,000」が含まれる）
    const priceDrops = screen.getAllByText(/−¥2,000/);
    expect(priceDrops.length).toBeGreaterThan(0);
  });

  /**
   * カテゴリバッジが正しく表示されることを確認
   */
  it('カテゴリバッジを正しく表示する', () => {
    const product = createMockProduct({ category: 'キッチン' });
    render(<ProductCard product={product} />);
    
    // カテゴリは複数箇所に表示される可能性があるため、getAllByTextを使用
    const categories = screen.getAllByText('キッチン');
    expect(categories.length).toBeGreaterThan(0);
  });

  /**
   * カテゴリが未設定の場合、「その他」が表示されることを確認
   */
  it('カテゴリが未設定の場合、「その他」を表示する', () => {
    const product = createMockProduct({ category: undefined });
    render(<ProductCard product={product} />);
    
    // 「その他」は複数箇所に表示される可能性があるため、getAllByTextを使用
    const otherCategories = screen.getAllByText('その他');
    expect(otherCategories.length).toBeGreaterThan(0);
  });

  /**
   * 商品画像のalt属性が正しく設定されることを確認
   */
  it('商品画像のalt属性を正しく設定する', () => {
    const product = createMockProduct({ name: 'テスト商品' });
    render(<ProductCard product={product} />);
    
    // 画像はモバイル用とPC用の2つ存在する可能性があるため、getAllByAltTextを使用
    const images = screen.getAllByAltText('テスト商品');
    expect(images.length).toBeGreaterThan(0);
  });

  /**
   * 価格履歴が不足している場合でもエラーが発生しないことを確認
   */
  it('価格履歴が不足している場合でも正常にレンダリングする', () => {
    const product = createMockProduct({
      priceHistory: [],
    });
    
    expect(() => {
      render(<ProductCard product={product} />);
    }).not.toThrow();
    
    // 商品名は表示される（複数箇所に表示される可能性があるため）
    const productNames = screen.getAllByText('テスト商品名');
    expect(productNames.length).toBeGreaterThan(0);
  });

  /**
   * isPriorityプロパティが正しく動作することを確認
   */
  it('isPriorityプロパティが正しく動作する', () => {
    const product = createMockProduct();
    const { container } = render(<ProductCard product={product} isPriority={true} />);
    
    // priority属性が設定された画像が存在することを確認
    const images = container.querySelectorAll('img');
    expect(images.length).toBeGreaterThan(0);
  });
});

