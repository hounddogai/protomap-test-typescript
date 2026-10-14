import * as text from "../../../../kit/text.js";
import { TierScore } from "./tier-score.js";

/** How screens and exports show a tier score. */
export class TierScoreView {
  code: string;
  name: string;
  pinned: string;
  startsAtText: string;
  cohort: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    pinned: string,
    startsAtText: string,
    cohort: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.pinned = pinned;
    this.startsAtText = startsAtText;
    this.cohort = cohort;
    this.statusLabel = statusLabel;
  }
}

export function toTierScoreView(item: TierScore): TierScoreView {
  return new TierScoreView(
    item.code,
    text.truncate(item.name, 120),
    `${item.pinned}`,
    String(item.startsAt),
    item.cohort,
    `${item.status}`.toUpperCase(),
  );
}

export function toTierScoreViews(items: TierScore[]): TierScoreView[] {
  const views: TierScoreView[] = [];
  for (const item of items) {
    views.push(toTierScoreView(item));
  }
  return views;
}

export function sumTierScoreView(view: TierScoreView): number {
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  return parsedStartsAt;
}
