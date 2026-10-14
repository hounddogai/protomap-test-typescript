import * as text from "../../../../kit/text.js";
import { FallbackCreativeWindow } from "./fallback-creative-window.js";

/** How screens and exports show a fallback creative window. */
export class FallbackCreativeWindowView {
  code: string;
  labelText: string;
  version: string;
  countryText: string;
  archived: string;
  openRate: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    version: string,
    countryText: string,
    archived: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.version = version;
    this.countryText = countryText;
    this.archived = archived;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackCreativeWindowView(item: FallbackCreativeWindow): FallbackCreativeWindowView {
  return new FallbackCreativeWindowView(
    text.truncate(item.code, 120),
    item.label,
    String(item.version),
    text.truncate(item.country, 40),
    `${item.archived}`,
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackCreativeWindowViews(items: FallbackCreativeWindow[]): FallbackCreativeWindowView[] {
  const views: FallbackCreativeWindowView[] = [];
  for (const item of items) {
    views.push(toFallbackCreativeWindowView(item));
  }
  return views;
}

export function sumFallbackCreativeWindowView(view: FallbackCreativeWindowView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedVersion + parsedOpenRate;
}
