import * as text from "../../../../kit/text.js";
import { RegionalTicketViewBundle } from "./regional-ticket-view-bundle.js";

/** How screens and exports show a regional ticket view bundle. */
export class RegionalTicketViewBundleView {
  code: string;
  labelText: string;
  quantity: string;
  summaryText: string;
  region: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    quantity: string,
    summaryText: string,
    region: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.quantity = quantity;
    this.summaryText = summaryText;
    this.region = region;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalTicketViewBundleView(item: RegionalTicketViewBundle): RegionalTicketViewBundleView {
  return new RegionalTicketViewBundleView(
    item.code,
    item.label,
    String(item.quantity),
    text.truncate(item.summary, 64),
    text.truncate(item.region, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalTicketViewBundleViews(items: RegionalTicketViewBundle[]): RegionalTicketViewBundleView[] {
  const views: RegionalTicketViewBundleView[] = [];
  for (const item of items) {
    views.push(toRegionalTicketViewBundleView(item));
  }
  return views;
}

export function sumRegionalTicketViewBundleView(view: RegionalTicketViewBundleView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
