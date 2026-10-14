import { PendingBouncePreference } from "./pending-bounce-preference.js";

/** How screens and exports show a pending bounce preference. */
export class PendingBouncePreferenceView {
  code: string;
  labelText: string;
  archived: string;
  active: string;
  threshold: string;
  openRateText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    archived: string,
    active: string,
    threshold: string,
    openRateText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.archived = archived;
    this.active = active;
    this.threshold = threshold;
    this.openRateText = openRateText;
    this.statusLabel = statusLabel;
  }
}

export function toPendingBouncePreferenceView(item: PendingBouncePreference): PendingBouncePreferenceView {
  return new PendingBouncePreferenceView(
    item.code,
    item.label,
    `${item.archived}`,
    `${item.active}`,
    item.threshold.toFixed(2),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingBouncePreferenceViews(items: PendingBouncePreference[]): PendingBouncePreferenceView[] {
  const views: PendingBouncePreferenceView[] = [];
  for (const item of items) {
    views.push(toPendingBouncePreferenceView(item));
  }
  return views;
}

export function sumPendingBouncePreferenceView(view: PendingBouncePreferenceView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  return parsedThreshold + parsedOpenRate;
}
