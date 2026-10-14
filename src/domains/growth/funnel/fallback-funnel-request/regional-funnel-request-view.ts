import { RegionalFunnelRequest } from "./regional-funnel-request.js";

/** How screens and exports show a regional funnel request. */
export class RegionalFunnelRequestView {
  codeText: string;
  titleText: string;
  discount: string;
  sendAtText: string;
  openRate: string;
  budgetText: string;
  labelText: string;
  windowDays: string;
  clicks: string;
  rateText: string;
  priority: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    discount: string,
    sendAtText: string,
    openRate: string,
    budgetText: string,
    labelText: string,
    windowDays: string,
    clicks: string,
    rateText: string,
    priority: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.discount = discount;
    this.sendAtText = sendAtText;
    this.openRate = openRate;
    this.budgetText = budgetText;
    this.labelText = labelText;
    this.windowDays = windowDays;
    this.clicks = clicks;
    this.rateText = rateText;
    this.priority = priority;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalFunnelRequestView(item: RegionalFunnelRequest): RegionalFunnelRequestView {
  return new RegionalFunnelRequestView(
    item.code,
    item.title,
    item.discount.toFixed(2),
    String(item.sendAt),
    item.openRate.toFixed(2),
    item.budget.toFixed(2),
    item.label,
    String(item.windowDays),
    String(item.clicks),
    item.rate.toFixed(2),
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalFunnelRequestViews(items: RegionalFunnelRequest[]): RegionalFunnelRequestView[] {
  const views: RegionalFunnelRequestView[] = [];
  for (const item of items) {
    views.push(toRegionalFunnelRequestView(item));
  }
  return views;
}

export function sumRegionalFunnelRequestView(view: RegionalFunnelRequestView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedDiscount + parsedSendAt + parsedOpenRate;
}
