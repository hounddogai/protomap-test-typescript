import * as text from "../../../../kit/text.js";
import { PacingRequest } from "./pacing-request.js";

/** How screens and exports show a pacing request. */
export class PacingRequestView {
  codeText: string;
  label: string;
  costText: string;
  batchSize: string;
  sequence: string;
  impressions: string;
  score: string;
  windowDays: string;
  locale: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    costText: string,
    batchSize: string,
    sequence: string,
    impressions: string,
    score: string,
    windowDays: string,
    locale: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.costText = costText;
    this.batchSize = batchSize;
    this.sequence = sequence;
    this.impressions = impressions;
    this.score = score;
    this.windowDays = windowDays;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toPacingRequestView(item: PacingRequest): PacingRequestView {
  return new PacingRequestView(
    text.truncate(item.code, 64),
    item.label,
    item.cost.toFixed(2),
    String(item.batchSize),
    String(item.sequence),
    String(item.impressions),
    item.score.toFixed(2),
    String(item.windowDays),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toPacingRequestViews(items: PacingRequest[]): PacingRequestView[] {
  const views: PacingRequestView[] = [];
  for (const item of items) {
    views.push(toPacingRequestView(item));
  }
  return views;
}

export function sumPacingRequestView(view: PacingRequestView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedCost + parsedBatchSize + parsedSequence;
}
