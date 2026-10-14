import * as text from "../../../../kit/text.js";
import { ScheduledComplaintAudit } from "./scheduled-complaint-audit.js";

/** How screens and exports show a scheduled complaint audit. */
export class ScheduledComplaintAuditView {
  code: string;
  label: string;
  channel: string;
  activeText: string;
  descriptionText: string;
  minimum: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    channel: string,
    activeText: string,
    descriptionText: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.activeText = activeText;
    this.descriptionText = descriptionText;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledComplaintAuditView(item: ScheduledComplaintAudit): ScheduledComplaintAuditView {
  return new ScheduledComplaintAuditView(
    item.code,
    text.truncate(item.label, 120),
    text.truncate(item.channel, 40),
    `${item.active}`,
    text.truncate(item.description, 80),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledComplaintAuditViews(items: ScheduledComplaintAudit[]): ScheduledComplaintAuditView[] {
  const views: ScheduledComplaintAuditView[] = [];
  for (const item of items) {
    views.push(toScheduledComplaintAuditView(item));
  }
  return views;
}

export function sumScheduledComplaintAuditView(view: ScheduledComplaintAuditView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedMinimum;
}
