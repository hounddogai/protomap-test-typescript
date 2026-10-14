import * as text from "../../../../kit/text.js";
import { FraudCheckQuota } from "./fraud-check-quota.js";

/** How screens and exports show a fraud check quota. */
export class FraudCheckQuotaView {
  codeText: string;
  name: string;
  locale: string;
  sequence: string;
  channel: string;
  expiresAt: string;
  cost: string;
  sendAt: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    locale: string,
    sequence: string,
    channel: string,
    expiresAt: string,
    cost: string,
    sendAt: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.locale = locale;
    this.sequence = sequence;
    this.channel = channel;
    this.expiresAt = expiresAt;
    this.cost = cost;
    this.sendAt = sendAt;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toFraudCheckQuotaView(item: FraudCheckQuota): FraudCheckQuotaView {
  return new FraudCheckQuotaView(
    item.code,
    item.name,
    text.truncate(item.locale, 80),
    String(item.sequence),
    item.channel,
    String(item.expiresAt),
    item.cost.toFixed(2),
    String(item.sendAt),
    item.reviewer,
    `${item.status}`.toUpperCase(),
  );
}

export function toFraudCheckQuotaViews(items: FraudCheckQuota[]): FraudCheckQuotaView[] {
  const views: FraudCheckQuotaView[] = [];
  for (const item of items) {
    views.push(toFraudCheckQuotaView(item));
  }
  return views;
}

export function sumFraudCheckQuotaView(view: FraudCheckQuotaView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedSequence + parsedExpiresAt + parsedCost;
}
