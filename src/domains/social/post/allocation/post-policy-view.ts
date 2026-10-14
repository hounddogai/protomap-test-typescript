import * as text from "../../../../kit/text.js";
import { PostPolicy } from "./post-policy.js";

/** How screens and exports show a post policy. */
export class PostPolicyView {
  code: string;
  label: string;
  archived: string;
  scoreText: string;
  currency: string;
  sourceText: string;
  quantityText: string;
  approved: string;
  utmSource: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    archived: string,
    scoreText: string,
    currency: string,
    sourceText: string,
    quantityText: string,
    approved: string,
    utmSource: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.scoreText = scoreText;
    this.currency = currency;
    this.sourceText = sourceText;
    this.quantityText = quantityText;
    this.approved = approved;
    this.utmSource = utmSource;
    this.statusLabel = statusLabel;
  }
}

export function toPostPolicyView(item: PostPolicy): PostPolicyView {
  return new PostPolicyView(
    item.code,
    text.truncate(item.label, 64),
    `${item.archived}`,
    item.score.toFixed(2),
    item.currency,
    text.truncate(item.source, 64),
    String(item.quantity),
    `${item.approved}`,
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toPostPolicyViews(items: PostPolicy[]): PostPolicyView[] {
  const views: PostPolicyView[] = [];
  for (const item of items) {
    views.push(toPostPolicyView(item));
  }
  return views;
}

export function sumPostPolicyView(view: PostPolicyView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedScore + parsedQuantity;
}
