import { OptOutAdjustment } from "./opt-out-adjustment.js";

/** How screens and exports show a opt out adjustment. */
export class OptOutAdjustmentView {
  code: string;
  name: string;
  pinned: string;
  scoreText: string;
  statusLabel: string;

  constructor(code: string, name: string, pinned: string, scoreText: string, statusLabel: string) {
    this.code = code;
    this.name = name;
    this.pinned = pinned;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toOptOutAdjustmentView(item: OptOutAdjustment): OptOutAdjustmentView {
  return new OptOutAdjustmentView(
    item.code,
    item.name,
    `${item.pinned}`,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toOptOutAdjustmentViews(items: OptOutAdjustment[]): OptOutAdjustmentView[] {
  const views: OptOutAdjustmentView[] = [];
  for (const item of items) {
    views.push(toOptOutAdjustmentView(item));
  }
  return views;
}

export function sumOptOutAdjustmentView(view: OptOutAdjustmentView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedScore;
}
