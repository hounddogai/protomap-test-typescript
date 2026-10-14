import * as text from "../../../../kit/text.js";
import { OptOutBundle } from "./opt-out-bundle.js";

/** How screens and exports show a opt out bundle. */
export class OptOutBundleView {
  code: string;
  labelText: string;
  channel: string;
  expiresAt: string;
  title: string;
  externalRef: string;
  cohortText: string;
  quantity: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    channel: string,
    expiresAt: string,
    title: string,
    externalRef: string,
    cohortText: string,
    quantity: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.channel = channel;
    this.expiresAt = expiresAt;
    this.title = title;
    this.externalRef = externalRef;
    this.cohortText = cohortText;
    this.quantity = quantity;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toOptOutBundleView(item: OptOutBundle): OptOutBundleView {
  return new OptOutBundleView(
    item.code,
    text.truncate(item.label, 40),
    item.channel,
    String(item.expiresAt),
    text.truncate(item.title, 80),
    item.externalRef,
    text.truncate(item.cohort, 80),
    String(item.quantity),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toOptOutBundleViews(items: OptOutBundle[]): OptOutBundleView[] {
  const views: OptOutBundleView[] = [];
  for (const item of items) {
    views.push(toOptOutBundleView(item));
  }
  return views;
}

export function sumOptOutBundleView(view: OptOutBundleView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedExpiresAt + parsedQuantity + parsedScore;
}
