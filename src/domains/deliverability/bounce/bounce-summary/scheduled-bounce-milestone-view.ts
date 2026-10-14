import * as text from "../../../../kit/text.js";
import { ScheduledBounceMilestone } from "./scheduled-bounce-milestone.js";

/** How screens and exports show a scheduled bounce milestone. */
export class ScheduledBounceMilestoneView {
  code: string;
  labelText: string;
  version: string;
  name: string;
  locale: string;
  threshold: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    version: string,
    name: string,
    locale: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.version = version;
    this.name = name;
    this.locale = locale;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledBounceMilestoneView(item: ScheduledBounceMilestone): ScheduledBounceMilestoneView {
  return new ScheduledBounceMilestoneView(
    item.code,
    text.truncate(item.label, 120),
    String(item.version),
    item.name,
    text.truncate(item.locale, 64),
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledBounceMilestoneViews(items: ScheduledBounceMilestone[]): ScheduledBounceMilestoneView[] {
  const views: ScheduledBounceMilestoneView[] = [];
  for (const item of items) {
    views.push(toScheduledBounceMilestoneView(item));
  }
  return views;
}

export function sumScheduledBounceMilestoneView(view: ScheduledBounceMilestoneView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedVersion + parsedThreshold;
}
