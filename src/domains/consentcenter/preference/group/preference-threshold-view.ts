import * as text from "../../../../kit/text.js";
import { PreferenceThreshold } from "./preference-threshold.js";

/** How screens and exports show a preference threshold. */
export class PreferenceThresholdView {
  code: string;
  label: string;
  ownerId: string;
  version: string;
  priority: string;
  timezone: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    version: string,
    priority: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.version = version;
    this.priority = priority;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toPreferenceThresholdView(item: PreferenceThreshold): PreferenceThresholdView {
  return new PreferenceThresholdView(
    item.code,
    item.label,
    text.truncate(item.ownerId, 40),
    String(item.version),
    String(item.priority),
    item.timezone,
    `${item.status}`.toUpperCase(),
  );
}

export function toPreferenceThresholdViews(items: PreferenceThreshold[]): PreferenceThresholdView[] {
  const views: PreferenceThresholdView[] = [];
  for (const item of items) {
    views.push(toPreferenceThresholdView(item));
  }
  return views;
}

export function sumPreferenceThresholdView(view: PreferenceThresholdView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedVersion + parsedPriority;
}
