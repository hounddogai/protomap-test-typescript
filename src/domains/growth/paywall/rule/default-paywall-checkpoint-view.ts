import * as text from "../../../../kit/text.js";
import { DefaultPaywallCheckpoint } from "./default-paywall-checkpoint.js";

/** How screens and exports show a default paywall checkpoint. */
export class DefaultPaywallCheckpointView {
  codeText: string;
  name: string;
  locale: string;
  priority: string;
  unit: string;
  impressions: string;
  threshold: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    locale: string,
    priority: string,
    unit: string,
    impressions: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.locale = locale;
    this.priority = priority;
    this.unit = unit;
    this.impressions = impressions;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultPaywallCheckpointView(item: DefaultPaywallCheckpoint): DefaultPaywallCheckpointView {
  return new DefaultPaywallCheckpointView(
    item.code,
    text.truncate(item.name, 80),
    item.locale,
    String(item.priority),
    item.unit,
    String(item.impressions),
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultPaywallCheckpointViews(items: DefaultPaywallCheckpoint[]): DefaultPaywallCheckpointView[] {
  const views: DefaultPaywallCheckpointView[] = [];
  for (const item of items) {
    views.push(toDefaultPaywallCheckpointView(item));
  }
  return views;
}

export function sumDefaultPaywallCheckpointView(view: DefaultPaywallCheckpointView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedPriority + parsedImpressions + parsedThreshold;
}
