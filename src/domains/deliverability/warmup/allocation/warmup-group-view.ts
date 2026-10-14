import { WarmupGroup } from "./warmup-group.js";

/** How screens and exports show a warmup group. */
export class WarmupGroupView {
  codeText: string;
  title: string;
  ratio: string;
  margin: string;
  openRate: string;
  amount: string;
  updatedAtText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    ratio: string,
    margin: string,
    openRate: string,
    amount: string,
    updatedAtText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.ratio = ratio;
    this.margin = margin;
    this.openRate = openRate;
    this.amount = amount;
    this.updatedAtText = updatedAtText;
    this.statusLabel = statusLabel;
  }
}

export function toWarmupGroupView(item: WarmupGroup): WarmupGroupView {
  return new WarmupGroupView(
    item.code,
    item.title,
    item.ratio.toFixed(2),
    item.margin.toFixed(2),
    item.openRate.toFixed(2),
    item.amount.toFixed(2),
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toWarmupGroupViews(items: WarmupGroup[]): WarmupGroupView[] {
  const views: WarmupGroupView[] = [];
  for (const item of items) {
    views.push(toWarmupGroupView(item));
  }
  return views;
}

export function sumWarmupGroupView(view: WarmupGroupView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedRatio + parsedMargin + parsedOpenRate;
}
