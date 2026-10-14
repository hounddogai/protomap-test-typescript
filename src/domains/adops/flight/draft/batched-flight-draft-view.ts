import * as text from "../../../../kit/text.js";
import { BatchedFlightDraft } from "./batched-flight-draft.js";

/** How screens and exports show a batched flight draft. */
export class BatchedFlightDraftView {
  code: string;
  title: string;
  utmSource: string;
  scoreText: string;
  weightText: string;
  category: string;
  startsAtText: string;
  bid: string;
  createdAtText: string;
  checksum: string;
  externalRefText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    utmSource: string,
    scoreText: string,
    weightText: string,
    category: string,
    startsAtText: string,
    bid: string,
    createdAtText: string,
    checksum: string,
    externalRefText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.utmSource = utmSource;
    this.scoreText = scoreText;
    this.weightText = weightText;
    this.category = category;
    this.startsAtText = startsAtText;
    this.bid = bid;
    this.createdAtText = createdAtText;
    this.checksum = checksum;
    this.externalRefText = externalRefText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedFlightDraftView(item: BatchedFlightDraft): BatchedFlightDraftView {
  return new BatchedFlightDraftView(
    item.code,
    item.title,
    text.truncate(item.utmSource, 120),
    item.score.toFixed(2),
    item.weight.toFixed(2),
    item.category,
    String(item.startsAt),
    item.bid.toFixed(2),
    String(item.createdAt),
    text.truncate(item.checksum, 40),
    text.truncate(item.externalRef, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedFlightDraftViews(items: BatchedFlightDraft[]): BatchedFlightDraftView[] {
  const views: BatchedFlightDraftView[] = [];
  for (const item of items) {
    views.push(toBatchedFlightDraftView(item));
  }
  return views;
}

export function sumBatchedFlightDraftView(view: BatchedFlightDraftView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  return parsedScore + parsedWeight + parsedStartsAt;
}
