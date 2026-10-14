import * as text from "../../../../kit/text.js";
import { SlaBundle } from "./sla-bundle.js";

/** How screens and exports show a sla bundle. */
export class SlaBundleView {
  code: string;
  titleText: string;
  budgetText: string;
  nameText: string;
  channel: string;
  startsAtText: string;
  audienceId: string;
  labelText: string;
  unit: string;
  openRateText: string;
  variant: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    budgetText: string,
    nameText: string,
    channel: string,
    startsAtText: string,
    audienceId: string,
    labelText: string,
    unit: string,
    openRateText: string,
    variant: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.budgetText = budgetText;
    this.nameText = nameText;
    this.channel = channel;
    this.startsAtText = startsAtText;
    this.audienceId = audienceId;
    this.labelText = labelText;
    this.unit = unit;
    this.openRateText = openRateText;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toSlaBundleView(item: SlaBundle): SlaBundleView {
  return new SlaBundleView(
    item.code,
    text.truncate(item.title, 64),
    item.budget.toFixed(2),
    item.name,
    item.channel,
    String(item.startsAt),
    text.truncate(item.audienceId, 120),
    text.truncate(item.label, 64),
    item.unit,
    item.openRate.toFixed(2),
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toSlaBundleViews(items: SlaBundle[]): SlaBundleView[] {
  const views: SlaBundleView[] = [];
  for (const item of items) {
    views.push(toSlaBundleView(item));
  }
  return views;
}

export function sumSlaBundleView(view: SlaBundleView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  return parsedBudget + parsedStartsAt + parsedOpenRate;
}
