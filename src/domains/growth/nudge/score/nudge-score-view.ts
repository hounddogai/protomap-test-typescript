import { NudgeScore } from "./nudge-score.js";

/** How screens and exports show a nudge score. */
export class NudgeScoreView {
  code: string;
  titleText: string;
  batchSize: string;
  cohortText: string;
  durationMinutesText: string;
  rateText: string;
  ownerId: string;
  windowDays: string;
  quantity: string;
  labelText: string;
  margin: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    batchSize: string,
    cohortText: string,
    durationMinutesText: string,
    rateText: string,
    ownerId: string,
    windowDays: string,
    quantity: string,
    labelText: string,
    margin: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.batchSize = batchSize;
    this.cohortText = cohortText;
    this.durationMinutesText = durationMinutesText;
    this.rateText = rateText;
    this.ownerId = ownerId;
    this.windowDays = windowDays;
    this.quantity = quantity;
    this.labelText = labelText;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toNudgeScoreView(item: NudgeScore): NudgeScoreView {
  return new NudgeScoreView(
    item.code,
    item.title,
    String(item.batchSize),
    item.cohort,
    String(item.durationMinutes),
    item.rate.toFixed(2),
    item.ownerId,
    String(item.windowDays),
    String(item.quantity),
    item.label,
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toNudgeScoreViews(items: NudgeScore[]): NudgeScoreView[] {
  const views: NudgeScoreView[] = [];
  for (const item of items) {
    views.push(toNudgeScoreView(item));
  }
  return views;
}

export function sumNudgeScoreView(view: NudgeScoreView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  return parsedBatchSize + parsedDurationMinutes + parsedRate;
}
