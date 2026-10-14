import * as text from "../../../../kit/text.js";
import { CappedBidRuleCycle } from "./capped-bid-rule-cycle.js";

/** How screens and exports show a capped bid rule cycle. */
export class CappedBidRuleCycleView {
  codeText: string;
  nameText: string;
  capacity: string;
  localeText: string;
  openRate: string;
  createdAt: string;
  summaryText: string;
  versionText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    capacity: string,
    localeText: string,
    openRate: string,
    createdAt: string,
    summaryText: string,
    versionText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.capacity = capacity;
    this.localeText = localeText;
    this.openRate = openRate;
    this.createdAt = createdAt;
    this.summaryText = summaryText;
    this.versionText = versionText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedBidRuleCycleView(item: CappedBidRuleCycle): CappedBidRuleCycleView {
  return new CappedBidRuleCycleView(
    item.code,
    text.truncate(item.name, 40),
    String(item.capacity),
    text.truncate(item.locale, 120),
    item.openRate.toFixed(2),
    String(item.createdAt),
    item.summary,
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedBidRuleCycleViews(items: CappedBidRuleCycle[]): CappedBidRuleCycleView[] {
  const views: CappedBidRuleCycleView[] = [];
  for (const item of items) {
    views.push(toCappedBidRuleCycleView(item));
  }
  return views;
}

export function sumCappedBidRuleCycleView(view: CappedBidRuleCycleView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedCapacity + parsedOpenRate + parsedCreatedAt;
}
