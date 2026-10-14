import { TieredWindowMilestone } from "./tiered-window-milestone.js";

/** How screens and exports show a tiered window milestone. */
export class TieredWindowMilestoneView {
  codeText: string;
  label: string;
  durationMinutesText: string;
  priority: string;
  ratio: string;
  name: string;
  rate: string;
  discountText: string;
  checksumText: string;
  channel: string;
  updatedAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    durationMinutesText: string,
    priority: string,
    ratio: string,
    name: string,
    rate: string,
    discountText: string,
    checksumText: string,
    channel: string,
    updatedAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.durationMinutesText = durationMinutesText;
    this.priority = priority;
    this.ratio = ratio;
    this.name = name;
    this.rate = rate;
    this.discountText = discountText;
    this.checksumText = checksumText;
    this.channel = channel;
    this.updatedAt = updatedAt;
    this.statusLabel = statusLabel;
  }
}

export function toTieredWindowMilestoneView(item: TieredWindowMilestone): TieredWindowMilestoneView {
  return new TieredWindowMilestoneView(
    item.code,
    item.label,
    String(item.durationMinutes),
    String(item.priority),
    item.ratio.toFixed(2),
    item.name,
    item.rate.toFixed(2),
    item.discount.toFixed(2),
    item.checksum,
    item.channel,
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredWindowMilestoneViews(items: TieredWindowMilestone[]): TieredWindowMilestoneView[] {
  const views: TieredWindowMilestoneView[] = [];
  for (const item of items) {
    views.push(toTieredWindowMilestoneView(item));
  }
  return views;
}

export function sumTieredWindowMilestoneView(view: TieredWindowMilestoneView): number {
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedDurationMinutes + parsedPriority + parsedRatio;
}
