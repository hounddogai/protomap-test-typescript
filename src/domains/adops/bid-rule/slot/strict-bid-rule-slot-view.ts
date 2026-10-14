import { StrictBidRuleSlot } from "./strict-bid-rule-slot.js";

/** How screens and exports show a strict bid rule slot. */
export class StrictBidRuleSlotView {
  codeText: string;
  title: string;
  sequenceText: string;
  rate: string;
  ownerId: string;
  attempts: string;
  phone: string;
  clicks: string;
  maximumText: string;
  expiresAtText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    sequenceText: string,
    rate: string,
    ownerId: string,
    attempts: string,
    phone: string,
    clicks: string,
    maximumText: string,
    expiresAtText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.sequenceText = sequenceText;
    this.rate = rate;
    this.ownerId = ownerId;
    this.attempts = attempts;
    this.phone = phone;
    this.clicks = clicks;
    this.maximumText = maximumText;
    this.expiresAtText = expiresAtText;
    this.statusLabel = statusLabel;
  }
}

export function toStrictBidRuleSlotView(item: StrictBidRuleSlot): StrictBidRuleSlotView {
  return new StrictBidRuleSlotView(
    item.code,
    item.title,
    String(item.sequence),
    item.rate.toFixed(2),
    item.ownerId,
    String(item.attempts),
    item.phone,
    String(item.clicks),
    item.maximum.toFixed(2),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictBidRuleSlotViews(items: StrictBidRuleSlot[]): StrictBidRuleSlotView[] {
  const views: StrictBidRuleSlotView[] = [];
  for (const item of items) {
    views.push(toStrictBidRuleSlotView(item));
  }
  return views;
}

export function sumStrictBidRuleSlotView(view: StrictBidRuleSlotView): number {
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedSequence + parsedRate + parsedAttempts;
}
