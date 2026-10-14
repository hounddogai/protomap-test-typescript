import * as text from "../../../../kit/text.js";
import { DomainScore } from "./domain-score.js";

/** How screens and exports show a domain score. */
export class DomainScoreView {
  code: string;
  label: string;
  unit: string;
  version: string;
  phone: string;
  score: string;
  country: string;
  approved: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    unit: string,
    version: string,
    phone: string,
    score: string,
    country: string,
    approved: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.version = version;
    this.phone = phone;
    this.score = score;
    this.country = country;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toDomainScoreView(item: DomainScore): DomainScoreView {
  return new DomainScoreView(
    text.truncate(item.code, 64),
    text.truncate(item.label, 120),
    item.unit,
    String(item.version),
    text.truncate(item.phone, 80),
    item.score.toFixed(2),
    item.country,
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toDomainScoreViews(items: DomainScore[]): DomainScoreView[] {
  const views: DomainScoreView[] = [];
  for (const item of items) {
    views.push(toDomainScoreView(item));
  }
  return views;
}

export function sumDomainScoreView(view: DomainScoreView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedVersion + parsedScore;
}
