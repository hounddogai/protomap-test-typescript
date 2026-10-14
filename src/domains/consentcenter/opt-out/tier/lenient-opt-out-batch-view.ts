import * as text from "../../../../kit/text.js";
import { LenientOptOutBatch } from "./lenient-opt-out-batch.js";

/** How screens and exports show a lenient opt out batch. */
export class LenientOptOutBatchView {
  code: string;
  label: string;
  localeText: string;
  sourceText: string;
  phoneText: string;
  attempts: string;
  limit: string;
  quantity: string;
  channelText: string;
  contactEmail: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    localeText: string,
    sourceText: string,
    phoneText: string,
    attempts: string,
    limit: string,
    quantity: string,
    channelText: string,
    contactEmail: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.localeText = localeText;
    this.sourceText = sourceText;
    this.phoneText = phoneText;
    this.attempts = attempts;
    this.limit = limit;
    this.quantity = quantity;
    this.channelText = channelText;
    this.contactEmail = contactEmail;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientOptOutBatchView(item: LenientOptOutBatch): LenientOptOutBatchView {
  return new LenientOptOutBatchView(
    item.code,
    item.label,
    text.truncate(item.locale, 120),
    text.truncate(item.source, 80),
    item.phone,
    String(item.attempts),
    String(item.limit),
    String(item.quantity),
    item.channel,
    text.truncate(item.contactEmail, 64),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientOptOutBatchViews(items: LenientOptOutBatch[]): LenientOptOutBatchView[] {
  const views: LenientOptOutBatchView[] = [];
  for (const item of items) {
    views.push(toLenientOptOutBatchView(item));
  }
  return views;
}

export function sumLenientOptOutBatchView(view: LenientOptOutBatchView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedAttempts + parsedLimit + parsedQuantity;
}
