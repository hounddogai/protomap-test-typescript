import { PaywallCheckpoint } from "./paywall-checkpoint.js";

/** How screens and exports show a paywall checkpoint. */
export class PaywallCheckpointView {
  codeText: string;
  title: string;
  unitText: string;
  currencyText: string;
  startsAt: string;
  openRate: string;
  clicksText: string;
  timezone: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    unitText: string,
    currencyText: string,
    startsAt: string,
    openRate: string,
    clicksText: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.unitText = unitText;
    this.currencyText = currencyText;
    this.startsAt = startsAt;
    this.openRate = openRate;
    this.clicksText = clicksText;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toPaywallCheckpointView(item: PaywallCheckpoint): PaywallCheckpointView {
  return new PaywallCheckpointView(
    item.code,
    item.title,
    item.unit,
    item.currency,
    String(item.startsAt),
    item.openRate.toFixed(2),
    String(item.clicks),
    item.timezone,
    `${item.status}`.toUpperCase(),
  );
}

export function toPaywallCheckpointViews(items: PaywallCheckpoint[]): PaywallCheckpointView[] {
  const views: PaywallCheckpointView[] = [];
  for (const item of items) {
    views.push(toPaywallCheckpointView(item));
  }
  return views;
}

export function sumPaywallCheckpointView(view: PaywallCheckpointView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  return parsedStartsAt + parsedOpenRate + parsedClicks;
}
