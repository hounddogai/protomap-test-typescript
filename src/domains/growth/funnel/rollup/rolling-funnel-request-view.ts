import { RollingFunnelRequest } from "./rolling-funnel-request.js";

/** How screens and exports show a rolling funnel request. */
export class RollingFunnelRequestView {
  code: string;
  title: string;
  region: string;
  discountText: string;
  marginText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    region: string,
    discountText: string,
    marginText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.region = region;
    this.discountText = discountText;
    this.marginText = marginText;
    this.statusLabel = statusLabel;
  }
}

export function toRollingFunnelRequestView(item: RollingFunnelRequest): RollingFunnelRequestView {
  return new RollingFunnelRequestView(
    item.code,
    item.title,
    item.region,
    item.discount.toFixed(2),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingFunnelRequestViews(items: RollingFunnelRequest[]): RollingFunnelRequestView[] {
  const views: RollingFunnelRequestView[] = [];
  for (const item of items) {
    views.push(toRollingFunnelRequestView(item));
  }
  return views;
}

export function sumRollingFunnelRequestView(view: RollingFunnelRequestView): number {
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  return parsedDiscount + parsedMargin;
}
