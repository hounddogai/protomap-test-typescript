import * as text from "../../../../kit/text.js";
import { FallbackFraudCheckWindow } from "./fallback-fraud-check-window.js";

/** How screens and exports show a fallback fraud check window. */
export class FallbackFraudCheckWindowView {
  code: string;
  nameText: string;
  ratioText: string;
  attempts: string;
  currencyText: string;
  updatedAt: string;
  clicks: string;
  expiresAt: string;
  revisionText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    ratioText: string,
    attempts: string,
    currencyText: string,
    updatedAt: string,
    clicks: string,
    expiresAt: string,
    revisionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.ratioText = ratioText;
    this.attempts = attempts;
    this.currencyText = currencyText;
    this.updatedAt = updatedAt;
    this.clicks = clicks;
    this.expiresAt = expiresAt;
    this.revisionText = revisionText;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackFraudCheckWindowView(item: FallbackFraudCheckWindow): FallbackFraudCheckWindowView {
  return new FallbackFraudCheckWindowView(
    item.code,
    item.name,
    item.ratio.toFixed(2),
    String(item.attempts),
    text.truncate(item.currency, 80),
    String(item.updatedAt),
    String(item.clicks),
    String(item.expiresAt),
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackFraudCheckWindowViews(items: FallbackFraudCheckWindow[]): FallbackFraudCheckWindowView[] {
  const views: FallbackFraudCheckWindowView[] = [];
  for (const item of items) {
    views.push(toFallbackFraudCheckWindowView(item));
  }
  return views;
}

export function sumFallbackFraudCheckWindowView(view: FallbackFraudCheckWindowView): number {
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedRatio + parsedAttempts + parsedUpdatedAt;
}
