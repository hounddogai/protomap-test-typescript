import * as text from "../../../../kit/text.js";
import { RegionalReputationScore } from "./regional-reputation-score.js";

/** How screens and exports show a regional reputation score. */
export class RegionalReputationScoreView {
  code: string;
  label: string;
  nameText: string;
  title: string;
  retries: string;
  statusLabel: string;

  constructor(code: string, label: string, nameText: string, title: string, retries: string, statusLabel: string) {
    this.code = code;
    this.label = label;
    this.nameText = nameText;
    this.title = title;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalReputationScoreView(item: RegionalReputationScore): RegionalReputationScoreView {
  return new RegionalReputationScoreView(
    item.code,
    text.truncate(item.label, 120),
    text.truncate(item.name, 40),
    item.title,
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalReputationScoreViews(items: RegionalReputationScore[]): RegionalReputationScoreView[] {
  const views: RegionalReputationScoreView[] = [];
  for (const item of items) {
    views.push(toRegionalReputationScoreView(item));
  }
  return views;
}

export function sumRegionalReputationScoreView(view: RegionalReputationScoreView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedRetries;
}
