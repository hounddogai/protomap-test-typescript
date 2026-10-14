import * as text from "../../../../kit/text.js";
import { FunnelGroup } from "./funnel-group.js";

/** How screens and exports show a funnel group. */
export class FunnelGroupView {
  codeText: string;
  titleText: string;
  weightText: string;
  summaryText: string;
  activeText: string;
  openRate: string;
  sendAt: string;
  retries: string;
  budgetText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    weightText: string,
    summaryText: string,
    activeText: string,
    openRate: string,
    sendAt: string,
    retries: string,
    budgetText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.weightText = weightText;
    this.summaryText = summaryText;
    this.activeText = activeText;
    this.openRate = openRate;
    this.sendAt = sendAt;
    this.retries = retries;
    this.budgetText = budgetText;
    this.statusLabel = statusLabel;
  }
}

export function toFunnelGroupView(item: FunnelGroup): FunnelGroupView {
  return new FunnelGroupView(
    item.code,
    item.title,
    item.weight.toFixed(2),
    text.truncate(item.summary, 40),
    `${item.active}`,
    item.openRate.toFixed(2),
    String(item.sendAt),
    String(item.retries),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFunnelGroupViews(items: FunnelGroup[]): FunnelGroupView[] {
  const views: FunnelGroupView[] = [];
  for (const item of items) {
    views.push(toFunnelGroupView(item));
  }
  return views;
}

export function sumFunnelGroupView(view: FunnelGroupView): number {
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedWeight + parsedOpenRate + parsedSendAt;
}
