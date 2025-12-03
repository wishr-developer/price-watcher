"use client";

interface DealScoreBadgeProps {
  score: number;
  showTooltip?: boolean;
}

/**
 * DAISO型：「お得度」を小さく・控えめに表示
 * - 40点未満：非表示
 * - 40点以上：「お得度」として表示
 * - カード下部に配置、主役にしない
 */
export default function DealScoreBadge({ score }: DealScoreBadgeProps) {
  // 40点未満は非表示
  if (score < 40) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-gray-500 border border-gray-200 bg-gray-50">
      <span>お得度（参考）</span>
      <span className="font-sans text-gray-600">{score}</span>
    </span>
  );
}

