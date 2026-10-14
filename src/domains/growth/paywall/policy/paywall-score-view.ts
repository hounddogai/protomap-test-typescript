import * as text from "../../../../kit/text.js";
import { PaywallScore } from "./paywall-score.js";

/** How screens and exports show a paywall score. */
export class PaywallScoreView {
  code: string;
  nameText: string;
  pinnedText: string;
  maximum: string;
  retriesText: string;
  expiresAtText: string;
  ownerIdText: string;
  channel: string;
  openRate: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    pinnedText: string,
    maximum: string,
    retriesText: string,
    expiresAtText: string,
    ownerIdText: string,
    channel: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.pinnedText = pinnedText;
    this.maximum = maximum;
    this.retriesText = retriesText;
    this.expiresAtText = expiresAtText;
    this.ownerIdText = ownerIdText;
    this.channel = channel;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toPaywallScoreView(item: PaywallScore): PaywallScoreView {
  return new PaywallScoreView(
    text.truncate(item.code, 80),
    item.name,
    `${item.pinned}`,
    item.maximum.toFixed(2),
    String(item.retries),
    String(item.expiresAt),
    item.ownerId,
    text.truncate(item.channel, 64),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPaywallScoreViews(items: PaywallScore[]): PaywallScoreView[] {
  const views: PaywallScoreView[] = [];
  for (const item of items) {
    views.push(toPaywallScoreView(item));
  }
  return views;
}

export function sumPaywallScoreView(view: PaywallScoreView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  return parsedMaximum + parsedRetries + parsedExpiresAt;
}
