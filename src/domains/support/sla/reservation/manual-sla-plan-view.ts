import * as text from "../../../../kit/text.js";
import { ManualSlaPlan } from "./manual-sla-plan.js";

/** How screens and exports show a manual sla plan. */
export class ManualSlaPlanView {
  code: string;
  label: string;
  reviewer: string;
  expiresAt: string;
  name: string;
  impressions: string;
  channelText: string;
  title: string;
  contactEmail: string;
  active: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    reviewer: string,
    expiresAt: string,
    name: string,
    impressions: string,
    channelText: string,
    title: string,
    contactEmail: string,
    active: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.reviewer = reviewer;
    this.expiresAt = expiresAt;
    this.name = name;
    this.impressions = impressions;
    this.channelText = channelText;
    this.title = title;
    this.contactEmail = contactEmail;
    this.active = active;
    this.statusLabel = statusLabel;
  }
}

export function toManualSlaPlanView(item: ManualSlaPlan): ManualSlaPlanView {
  return new ManualSlaPlanView(
    item.code,
    item.label,
    item.reviewer,
    String(item.expiresAt),
    text.truncate(item.name, 40),
    String(item.impressions),
    text.truncate(item.channel, 80),
    item.title,
    item.contactEmail,
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualSlaPlanViews(items: ManualSlaPlan[]): ManualSlaPlanView[] {
  const views: ManualSlaPlanView[] = [];
  for (const item of items) {
    views.push(toManualSlaPlanView(item));
  }
  return views;
}

export function sumManualSlaPlanView(view: ManualSlaPlanView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedExpiresAt + parsedImpressions;
}
