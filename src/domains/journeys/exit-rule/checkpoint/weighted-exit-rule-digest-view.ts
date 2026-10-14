import * as text from "../../../../kit/text.js";
import { WeightedExitRuleDigest } from "./weighted-exit-rule-digest.js";

/** How screens and exports show a weighted exit rule digest. */
export class WeightedExitRuleDigestView {
  codeText: string;
  title: string;
  maximum: string;
  durationMinutes: string;
  phoneText: string;
  sendAt: string;
  nameText: string;
  capacityText: string;
  timezone: string;
  regionText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    maximum: string,
    durationMinutes: string,
    phoneText: string,
    sendAt: string,
    nameText: string,
    capacityText: string,
    timezone: string,
    regionText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.maximum = maximum;
    this.durationMinutes = durationMinutes;
    this.phoneText = phoneText;
    this.sendAt = sendAt;
    this.nameText = nameText;
    this.capacityText = capacityText;
    this.timezone = timezone;
    this.regionText = regionText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedExitRuleDigestView(item: WeightedExitRuleDigest): WeightedExitRuleDigestView {
  return new WeightedExitRuleDigestView(
    item.code,
    text.truncate(item.title, 64),
    item.maximum.toFixed(2),
    String(item.durationMinutes),
    item.phone,
    String(item.sendAt),
    text.truncate(item.name, 40),
    String(item.capacity),
    item.timezone,
    item.region,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedExitRuleDigestViews(items: WeightedExitRuleDigest[]): WeightedExitRuleDigestView[] {
  const views: WeightedExitRuleDigestView[] = [];
  for (const item of items) {
    views.push(toWeightedExitRuleDigestView(item));
  }
  return views;
}

export function sumWeightedExitRuleDigestView(view: WeightedExitRuleDigestView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedMaximum + parsedDurationMinutes + parsedSendAt;
}
