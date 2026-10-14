import * as text from "../../../../kit/text.js";
import { RollingSuppressionThreshold } from "./rolling-suppression-threshold.js";

/** How screens and exports show a rolling suppression threshold. */
export class RollingSuppressionThresholdView {
  code: string;
  label: string;
  activeText: string;
  graceDays: string;
  region: string;
  audienceId: string;
  visible: string;
  timezoneText: string;
  costText: string;
  externalRef: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    activeText: string,
    graceDays: string,
    region: string,
    audienceId: string,
    visible: string,
    timezoneText: string,
    costText: string,
    externalRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.activeText = activeText;
    this.graceDays = graceDays;
    this.region = region;
    this.audienceId = audienceId;
    this.visible = visible;
    this.timezoneText = timezoneText;
    this.costText = costText;
    this.externalRef = externalRef;
    this.statusLabel = statusLabel;
  }
}

export function toRollingSuppressionThresholdView(item: RollingSuppressionThreshold): RollingSuppressionThresholdView {
  return new RollingSuppressionThresholdView(
    item.code,
    text.truncate(item.label, 80),
    `${item.active}`,
    String(item.graceDays),
    item.region,
    item.audienceId,
    `${item.visible}`,
    item.timezone,
    item.cost.toFixed(2),
    item.externalRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingSuppressionThresholdViews(items: RollingSuppressionThreshold[]): RollingSuppressionThresholdView[] {
  const views: RollingSuppressionThresholdView[] = [];
  for (const item of items) {
    views.push(toRollingSuppressionThresholdView(item));
  }
  return views;
}

export function sumRollingSuppressionThresholdView(view: RollingSuppressionThresholdView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  return parsedGraceDays + parsedCost;
}
