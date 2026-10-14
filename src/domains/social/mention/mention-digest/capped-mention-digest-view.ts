import { CappedMentionDigest } from "./capped-mention-digest.js";

/** How screens and exports show a capped mention digest. */
export class CappedMentionDigestView {
  code: string;
  label: string;
  maximum: string;
  campaignRefText: string;
  unit: string;
  sendAt: string;
  amountText: string;
  impressions: string;
  budgetText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    maximum: string,
    campaignRefText: string,
    unit: string,
    sendAt: string,
    amountText: string,
    impressions: string,
    budgetText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.maximum = maximum;
    this.campaignRefText = campaignRefText;
    this.unit = unit;
    this.sendAt = sendAt;
    this.amountText = amountText;
    this.impressions = impressions;
    this.budgetText = budgetText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedMentionDigestView(item: CappedMentionDigest): CappedMentionDigestView {
  return new CappedMentionDigestView(
    item.code,
    item.label,
    item.maximum.toFixed(2),
    item.campaignRef,
    item.unit,
    String(item.sendAt),
    item.amount.toFixed(2),
    String(item.impressions),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedMentionDigestViews(items: CappedMentionDigest[]): CappedMentionDigestView[] {
  const views: CappedMentionDigestView[] = [];
  for (const item of items) {
    views.push(toCappedMentionDigestView(item));
  }
  return views;
}

export function sumCappedMentionDigestView(view: CappedMentionDigestView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedMaximum + parsedSendAt + parsedAmount;
}
