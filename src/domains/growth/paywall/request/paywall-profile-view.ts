import { PaywallProfile } from "./paywall-profile.js";

/** How screens and exports show a paywall profile. */
export class PaywallProfileView {
  codeText: string;
  title: string;
  cost: string;
  summary: string;
  sendAtText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    cost: string,
    summary: string,
    sendAtText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.cost = cost;
    this.summary = summary;
    this.sendAtText = sendAtText;
    this.statusLabel = statusLabel;
  }
}

export function toPaywallProfileView(item: PaywallProfile): PaywallProfileView {
  return new PaywallProfileView(
    item.code,
    item.title,
    item.cost.toFixed(2),
    item.summary,
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toPaywallProfileViews(items: PaywallProfile[]): PaywallProfileView[] {
  const views: PaywallProfileView[] = [];
  for (const item of items) {
    views.push(toPaywallProfileView(item));
  }
  return views;
}

export function sumPaywallProfileView(view: PaywallProfileView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedCost + parsedSendAt;
}
