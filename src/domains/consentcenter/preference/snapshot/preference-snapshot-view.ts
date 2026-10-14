import * as text from "../../../../kit/text.js";
import { PreferenceSnapshot } from "./preference-snapshot.js";

/** How screens and exports show a preference snapshot. */
export class PreferenceSnapshotView {
  codeText: string;
  labelText: string;
  costText: string;
  rate: string;
  localeText: string;
  sendAtText: string;
  pinnedText: string;
  windowDaysText: string;
  timezone: string;
  country: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    costText: string,
    rate: string,
    localeText: string,
    sendAtText: string,
    pinnedText: string,
    windowDaysText: string,
    timezone: string,
    country: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.costText = costText;
    this.rate = rate;
    this.localeText = localeText;
    this.sendAtText = sendAtText;
    this.pinnedText = pinnedText;
    this.windowDaysText = windowDaysText;
    this.timezone = timezone;
    this.country = country;
    this.statusLabel = statusLabel;
  }
}

export function toPreferenceSnapshotView(item: PreferenceSnapshot): PreferenceSnapshotView {
  return new PreferenceSnapshotView(
    text.truncate(item.code, 64),
    item.label,
    item.cost.toFixed(2),
    item.rate.toFixed(2),
    item.locale,
    String(item.sendAt),
    `${item.pinned}`,
    String(item.windowDays),
    item.timezone,
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toPreferenceSnapshotViews(items: PreferenceSnapshot[]): PreferenceSnapshotView[] {
  const views: PreferenceSnapshotView[] = [];
  for (const item of items) {
    views.push(toPreferenceSnapshotView(item));
  }
  return views;
}

export function sumPreferenceSnapshotView(view: PreferenceSnapshotView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedCost + parsedRate + parsedSendAt;
}
