import * as text from "../../../../kit/text.js";
import { TieredBounceMilestone } from "./tiered-bounce-milestone.js";

/** How screens and exports show a tiered bounce milestone. */
export class TieredBounceMilestoneView {
  code: string;
  name: string;
  priority: string;
  retries: string;
  ratio: string;
  title: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    priority: string,
    retries: string,
    ratio: string,
    title: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.retries = retries;
    this.ratio = ratio;
    this.title = title;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toTieredBounceMilestoneView(item: TieredBounceMilestone): TieredBounceMilestoneView {
  return new TieredBounceMilestoneView(
    item.code,
    text.truncate(item.name, 80),
    String(item.priority),
    String(item.retries),
    item.ratio.toFixed(2),
    item.title,
    text.truncate(item.channel, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredBounceMilestoneViews(items: TieredBounceMilestone[]): TieredBounceMilestoneView[] {
  const views: TieredBounceMilestoneView[] = [];
  for (const item of items) {
    views.push(toTieredBounceMilestoneView(item));
  }
  return views;
}

export function sumTieredBounceMilestoneView(view: TieredBounceMilestoneView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedPriority + parsedRetries + parsedRatio;
}
