import * as text from "../../../../kit/text.js";
import { TieredFraudCheckPolicy } from "./tiered-fraud-check-policy.js";

/** How screens and exports show a tiered fraud check policy. */
export class TieredFraudCheckPolicyView {
  code: string;
  name: string;
  limit: string;
  score: string;
  reviewerText: string;
  utmSource: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    limit: string,
    score: string,
    reviewerText: string,
    utmSource: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.score = score;
    this.reviewerText = reviewerText;
    this.utmSource = utmSource;
    this.statusLabel = statusLabel;
  }
}

export function toTieredFraudCheckPolicyView(item: TieredFraudCheckPolicy): TieredFraudCheckPolicyView {
  return new TieredFraudCheckPolicyView(
    item.code,
    text.truncate(item.name, 80),
    String(item.limit),
    item.score.toFixed(2),
    item.reviewer,
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredFraudCheckPolicyViews(items: TieredFraudCheckPolicy[]): TieredFraudCheckPolicyView[] {
  const views: TieredFraudCheckPolicyView[] = [];
  for (const item of items) {
    views.push(toTieredFraudCheckPolicyView(item));
  }
  return views;
}

export function sumTieredFraudCheckPolicyView(view: TieredFraudCheckPolicyView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedLimit + parsedScore;
}
