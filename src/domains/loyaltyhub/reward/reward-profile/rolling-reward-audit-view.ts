import * as text from "../../../../kit/text.js";
import { RollingRewardAudit } from "./rolling-reward-audit.js";

/** How screens and exports show a rolling reward audit. */
export class RollingRewardAuditView {
  code: string;
  title: string;
  contactEmail: string;
  openRate: string;
  name: string;
  campaignRef: string;
  priority: string;
  durationMinutes: string;
  rate: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    openRate: string,
    name: string,
    campaignRef: string,
    priority: string,
    durationMinutes: string,
    rate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.openRate = openRate;
    this.name = name;
    this.campaignRef = campaignRef;
    this.priority = priority;
    this.durationMinutes = durationMinutes;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toRollingRewardAuditView(item: RollingRewardAudit): RollingRewardAuditView {
  return new RollingRewardAuditView(
    item.code,
    item.title,
    text.truncate(item.contactEmail, 64),
    item.openRate.toFixed(2),
    item.name,
    item.campaignRef,
    String(item.priority),
    String(item.durationMinutes),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingRewardAuditViews(items: RollingRewardAudit[]): RollingRewardAuditView[] {
  const views: RollingRewardAuditView[] = [];
  for (const item of items) {
    views.push(toRollingRewardAuditView(item));
  }
  return views;
}

export function sumRollingRewardAuditView(view: RollingRewardAuditView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedOpenRate + parsedPriority + parsedDurationMinutes;
}
