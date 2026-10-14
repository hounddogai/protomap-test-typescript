import * as text from "../../../../kit/text.js";
import { DefaultDoubleOptInScore } from "./default-double-opt-in-score.js";

/** How screens and exports show a default double opt in score. */
export class DefaultDoubleOptInScoreView {
  codeText: string;
  title: string;
  cohort: string;
  ceiling: string;
  openRate: string;
  category: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    cohort: string,
    ceiling: string,
    openRate: string,
    category: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.cohort = cohort;
    this.ceiling = ceiling;
    this.openRate = openRate;
    this.category = category;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultDoubleOptInScoreView(item: DefaultDoubleOptInScore): DefaultDoubleOptInScoreView {
  return new DefaultDoubleOptInScoreView(
    text.truncate(item.code, 120),
    text.truncate(item.title, 64),
    text.truncate(item.cohort, 80),
    item.ceiling.toFixed(2),
    item.openRate.toFixed(2),
    item.category,
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultDoubleOptInScoreViews(items: DefaultDoubleOptInScore[]): DefaultDoubleOptInScoreView[] {
  const views: DefaultDoubleOptInScoreView[] = [];
  for (const item of items) {
    views.push(toDefaultDoubleOptInScoreView(item));
  }
  return views;
}

export function sumDefaultDoubleOptInScoreView(view: DefaultDoubleOptInScoreView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedCeiling + parsedOpenRate;
}
