import * as text from "../../../../kit/text.js";
import { TieredTouchpointOverride } from "./tiered-touchpoint-override.js";

/** How screens and exports show a tiered touchpoint override. */
export class TieredTouchpointOverrideView {
  codeText: string;
  label: string;
  score: string;
  source: string;
  country: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    score: string,
    source: string,
    country: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.score = score;
    this.source = source;
    this.country = country;
    this.statusLabel = statusLabel;
  }
}

export function toTieredTouchpointOverrideView(item: TieredTouchpointOverride): TieredTouchpointOverrideView {
  return new TieredTouchpointOverrideView(
    text.truncate(item.code, 80),
    item.label,
    item.score.toFixed(2),
    text.truncate(item.source, 80),
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredTouchpointOverrideViews(items: TieredTouchpointOverride[]): TieredTouchpointOverrideView[] {
  const views: TieredTouchpointOverrideView[] = [];
  for (const item of items) {
    views.push(toTieredTouchpointOverrideView(item));
  }
  return views;
}

export function sumTieredTouchpointOverrideView(view: TieredTouchpointOverrideView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedScore;
}
