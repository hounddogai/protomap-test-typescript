import * as text from "../../../../kit/text.js";
import { TieredTouchpointWindow } from "./tiered-touchpoint-window.js";

/** How screens and exports show a tiered touchpoint window. */
export class TieredTouchpointWindowView {
  code: string;
  labelText: string;
  version: string;
  sourceText: string;
  threshold: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    version: string,
    sourceText: string,
    threshold: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.version = version;
    this.sourceText = sourceText;
    this.threshold = threshold;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toTieredTouchpointWindowView(item: TieredTouchpointWindow): TieredTouchpointWindowView {
  return new TieredTouchpointWindowView(
    text.truncate(item.code, 40),
    item.label,
    String(item.version),
    item.source,
    item.threshold.toFixed(2),
    text.truncate(item.locale, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredTouchpointWindowViews(items: TieredTouchpointWindow[]): TieredTouchpointWindowView[] {
  const views: TieredTouchpointWindowView[] = [];
  for (const item of items) {
    views.push(toTieredTouchpointWindowView(item));
  }
  return views;
}

export function sumTieredTouchpointWindowView(view: TieredTouchpointWindowView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedVersion + parsedThreshold;
}
