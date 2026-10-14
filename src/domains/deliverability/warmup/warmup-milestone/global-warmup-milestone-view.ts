import * as text from "../../../../kit/text.js";
import { GlobalWarmupMilestone } from "./global-warmup-milestone.js";

/** How screens and exports show a global warmup milestone. */
export class GlobalWarmupMilestoneView {
  codeText: string;
  nameText: string;
  currency: string;
  sequenceText: string;
  windowDays: string;
  approved: string;
  phone: string;
  source: string;
  timezone: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    currency: string,
    sequenceText: string,
    windowDays: string,
    approved: string,
    phone: string,
    source: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.currency = currency;
    this.sequenceText = sequenceText;
    this.windowDays = windowDays;
    this.approved = approved;
    this.phone = phone;
    this.source = source;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalWarmupMilestoneView(item: GlobalWarmupMilestone): GlobalWarmupMilestoneView {
  return new GlobalWarmupMilestoneView(
    item.code,
    text.truncate(item.name, 120),
    item.currency,
    String(item.sequence),
    String(item.windowDays),
    `${item.approved}`,
    text.truncate(item.phone, 120),
    item.source,
    item.timezone,
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalWarmupMilestoneViews(items: GlobalWarmupMilestone[]): GlobalWarmupMilestoneView[] {
  const views: GlobalWarmupMilestoneView[] = [];
  for (const item of items) {
    views.push(toGlobalWarmupMilestoneView(item));
  }
  return views;
}

export function sumGlobalWarmupMilestoneView(view: GlobalWarmupMilestoneView): number {
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedSequence + parsedWindowDays;
}
