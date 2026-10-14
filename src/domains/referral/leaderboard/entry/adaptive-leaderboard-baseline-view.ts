import * as text from "../../../../kit/text.js";
import { AdaptiveLeaderboardBaseline } from "./adaptive-leaderboard-baseline.js";

/** How screens and exports show a adaptive leaderboard baseline. */
export class AdaptiveLeaderboardBaselineView {
  code: string;
  name: string;
  segment: string;
  revision: string;
  discount: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    segment: string,
    revision: string,
    discount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.revision = revision;
    this.discount = discount;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveLeaderboardBaselineView(item: AdaptiveLeaderboardBaseline): AdaptiveLeaderboardBaselineView {
  return new AdaptiveLeaderboardBaselineView(
    text.truncate(item.code, 80),
    item.name,
    item.segment,
    String(item.revision),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveLeaderboardBaselineViews(items: AdaptiveLeaderboardBaseline[]): AdaptiveLeaderboardBaselineView[] {
  const views: AdaptiveLeaderboardBaselineView[] = [];
  for (const item of items) {
    views.push(toAdaptiveLeaderboardBaselineView(item));
  }
  return views;
}

export function sumAdaptiveLeaderboardBaselineView(view: AdaptiveLeaderboardBaselineView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedRevision + parsedDiscount;
}
