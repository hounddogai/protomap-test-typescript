import * as text from "../../../../kit/text.js";
import { RedemptionClaim } from "./redemption-claim.js";

/** How screens and exports show a redemption claim. */
export class RedemptionClaimView {
  code: string;
  labelText: string;
  limit: string;
  channel: string;
  attemptsText: string;
  endsAtText: string;
  minimum: string;
  quantity: string;
  conversionRate: string;
  clicks: string;
  graceDaysText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    limit: string,
    channel: string,
    attemptsText: string,
    endsAtText: string,
    minimum: string,
    quantity: string,
    conversionRate: string,
    clicks: string,
    graceDaysText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.limit = limit;
    this.channel = channel;
    this.attemptsText = attemptsText;
    this.endsAtText = endsAtText;
    this.minimum = minimum;
    this.quantity = quantity;
    this.conversionRate = conversionRate;
    this.clicks = clicks;
    this.graceDaysText = graceDaysText;
    this.statusLabel = statusLabel;
  }
}

export function toRedemptionClaimView(item: RedemptionClaim): RedemptionClaimView {
  return new RedemptionClaimView(
    text.truncate(item.code, 64),
    text.truncate(item.label, 40),
    String(item.limit),
    item.channel,
    String(item.attempts),
    String(item.endsAt),
    item.minimum.toFixed(2),
    String(item.quantity),
    item.conversionRate.toFixed(2),
    String(item.clicks),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toRedemptionClaimViews(items: RedemptionClaim[]): RedemptionClaimView[] {
  const views: RedemptionClaimView[] = [];
  for (const item of items) {
    views.push(toRedemptionClaimView(item));
  }
  return views;
}

export function sumRedemptionClaimView(view: RedemptionClaimView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  return parsedLimit + parsedAttempts + parsedEndsAt;
}
