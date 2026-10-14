import { DoubleOptInWindow } from "./double-opt-in-window.js";

/** How screens and exports show a double opt in window. */
export class DoubleOptInWindowView {
  code: string;
  title: string;
  campaignRefText: string;
  versionText: string;
  windowDaysText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    campaignRefText: string,
    versionText: string,
    windowDaysText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRefText = campaignRefText;
    this.versionText = versionText;
    this.windowDaysText = windowDaysText;
    this.statusLabel = statusLabel;
  }
}

export function toDoubleOptInWindowView(item: DoubleOptInWindow): DoubleOptInWindowView {
  return new DoubleOptInWindowView(
    item.code,
    item.title,
    item.campaignRef,
    String(item.version),
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toDoubleOptInWindowViews(items: DoubleOptInWindow[]): DoubleOptInWindowView[] {
  const views: DoubleOptInWindowView[] = [];
  for (const item of items) {
    views.push(toDoubleOptInWindowView(item));
  }
  return views;
}

export function sumDoubleOptInWindowView(view: DoubleOptInWindowView): number {
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  return parsedVersion + parsedWindowDays;
}
