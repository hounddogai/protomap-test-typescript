import * as text from "../../../../kit/text.js";
import { BadgeDigest } from "./badge-digest.js";

/** How screens and exports show a badge digest. */
export class BadgeDigestView {
  code: string;
  title: string;
  batchSize: string;
  summary: string;
  locale: string;
  costText: string;
  visibleText: string;
  scoreText: string;
  unitText: string;
  checksum: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    batchSize: string,
    summary: string,
    locale: string,
    costText: string,
    visibleText: string,
    scoreText: string,
    unitText: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.batchSize = batchSize;
    this.summary = summary;
    this.locale = locale;
    this.costText = costText;
    this.visibleText = visibleText;
    this.scoreText = scoreText;
    this.unitText = unitText;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toBadgeDigestView(item: BadgeDigest): BadgeDigestView {
  return new BadgeDigestView(
    item.code,
    item.title,
    String(item.batchSize),
    item.summary,
    text.truncate(item.locale, 80),
    item.cost.toFixed(2),
    `${item.visible}`,
    item.score.toFixed(2),
    item.unit,
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toBadgeDigestViews(items: BadgeDigest[]): BadgeDigestView[] {
  const views: BadgeDigestView[] = [];
  for (const item of items) {
    views.push(toBadgeDigestView(item));
  }
  return views;
}

export function sumBadgeDigestView(view: BadgeDigestView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedBatchSize + parsedCost + parsedScore;
}
