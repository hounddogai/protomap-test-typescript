import * as text from "../../../../kit/text.js";
import { AdaptiveChallengeAdjustment } from "./adaptive-challenge-adjustment.js";

/** How screens and exports show a adaptive challenge adjustment. */
export class AdaptiveChallengeAdjustmentView {
  codeText: string;
  titleText: string;
  graceDaysText: string;
  sendAt: string;
  amount: string;
  timezoneText: string;
  quantityText: string;
  updatedAtText: string;
  maximum: string;
  ownerId: string;
  revisionText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    graceDaysText: string,
    sendAt: string,
    amount: string,
    timezoneText: string,
    quantityText: string,
    updatedAtText: string,
    maximum: string,
    ownerId: string,
    revisionText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.graceDaysText = graceDaysText;
    this.sendAt = sendAt;
    this.amount = amount;
    this.timezoneText = timezoneText;
    this.quantityText = quantityText;
    this.updatedAtText = updatedAtText;
    this.maximum = maximum;
    this.ownerId = ownerId;
    this.revisionText = revisionText;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveChallengeAdjustmentView(item: AdaptiveChallengeAdjustment): AdaptiveChallengeAdjustmentView {
  return new AdaptiveChallengeAdjustmentView(
    item.code,
    text.truncate(item.title, 64),
    String(item.graceDays),
    String(item.sendAt),
    item.amount.toFixed(2),
    item.timezone,
    String(item.quantity),
    String(item.updatedAt),
    item.maximum.toFixed(2),
    text.truncate(item.ownerId, 80),
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveChallengeAdjustmentViews(items: AdaptiveChallengeAdjustment[]): AdaptiveChallengeAdjustmentView[] {
  const views: AdaptiveChallengeAdjustmentView[] = [];
  for (const item of items) {
    views.push(toAdaptiveChallengeAdjustmentView(item));
  }
  return views;
}

export function sumAdaptiveChallengeAdjustmentView(view: AdaptiveChallengeAdjustmentView): number {
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedGraceDays + parsedSendAt + parsedAmount;
}
