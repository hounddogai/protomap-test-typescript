import * as text from "../../../../kit/text.js";
import { RegionalPathBundle } from "./regional-path-bundle.js";

/** How screens and exports show a regional path bundle. */
export class RegionalPathBundleView {
  code: string;
  labelText: string;
  rateText: string;
  channel: string;
  openRate: string;
  graceDays: string;
  contactEmail: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    rateText: string,
    channel: string,
    openRate: string,
    graceDays: string,
    contactEmail: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.rateText = rateText;
    this.channel = channel;
    this.openRate = openRate;
    this.graceDays = graceDays;
    this.contactEmail = contactEmail;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalPathBundleView(item: RegionalPathBundle): RegionalPathBundleView {
  return new RegionalPathBundleView(
    item.code,
    text.truncate(item.label, 40),
    item.rate.toFixed(2),
    item.channel,
    item.openRate.toFixed(2),
    String(item.graceDays),
    item.contactEmail,
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalPathBundleViews(items: RegionalPathBundle[]): RegionalPathBundleView[] {
  const views: RegionalPathBundleView[] = [];
  for (const item of items) {
    views.push(toRegionalPathBundleView(item));
  }
  return views;
}

export function sumRegionalPathBundleView(view: RegionalPathBundleView): number {
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedRate + parsedOpenRate + parsedGraceDays;
}
