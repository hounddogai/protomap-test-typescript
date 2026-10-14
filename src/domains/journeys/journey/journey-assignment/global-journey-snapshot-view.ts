import * as text from "../../../../kit/text.js";
import { GlobalJourneySnapshot } from "./global-journey-snapshot.js";

/** How screens and exports show a global journey snapshot. */
export class GlobalJourneySnapshotView {
  code: string;
  titleText: string;
  currencyText: string;
  sequenceText: string;
  ceilingText: string;
  score: string;
  category: string;
  cost: string;
  country: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    currencyText: string,
    sequenceText: string,
    ceilingText: string,
    score: string,
    category: string,
    cost: string,
    country: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.currencyText = currencyText;
    this.sequenceText = sequenceText;
    this.ceilingText = ceilingText;
    this.score = score;
    this.category = category;
    this.cost = cost;
    this.country = country;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalJourneySnapshotView(item: GlobalJourneySnapshot): GlobalJourneySnapshotView {
  return new GlobalJourneySnapshotView(
    text.truncate(item.code, 40),
    item.title,
    text.truncate(item.currency, 40),
    String(item.sequence),
    item.ceiling.toFixed(2),
    item.score.toFixed(2),
    item.category,
    item.cost.toFixed(2),
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalJourneySnapshotViews(items: GlobalJourneySnapshot[]): GlobalJourneySnapshotView[] {
  const views: GlobalJourneySnapshotView[] = [];
  for (const item of items) {
    views.push(toGlobalJourneySnapshotView(item));
  }
  return views;
}

export function sumGlobalJourneySnapshotView(view: GlobalJourneySnapshotView): number {
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedSequence + parsedCeiling + parsedScore;
}
