import { SeasonalInsightSchedule } from "./seasonal-insight-schedule.js";

/** How screens and exports show a seasonal insight schedule. */
export class SeasonalInsightScheduleView {
  code: string;
  title: string;
  name: string;
  batchSizeText: string;
  amount: string;
  thresholdText: string;
  floorValue: string;
  marginText: string;
  limitText: string;
  approvedText: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    name: string,
    batchSizeText: string,
    amount: string,
    thresholdText: string,
    floorValue: string,
    marginText: string,
    limitText: string,
    approvedText: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.name = name;
    this.batchSizeText = batchSizeText;
    this.amount = amount;
    this.thresholdText = thresholdText;
    this.floorValue = floorValue;
    this.marginText = marginText;
    this.limitText = limitText;
    this.approvedText = approvedText;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalInsightScheduleView(item: SeasonalInsightSchedule): SeasonalInsightScheduleView {
  return new SeasonalInsightScheduleView(
    item.code,
    item.title,
    item.name,
    String(item.batchSize),
    item.amount.toFixed(2),
    item.threshold.toFixed(2),
    item.floorValue.toFixed(2),
    item.margin.toFixed(2),
    String(item.limit),
    `${item.approved}`,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalInsightScheduleViews(items: SeasonalInsightSchedule[]): SeasonalInsightScheduleView[] {
  const views: SeasonalInsightScheduleView[] = [];
  for (const item of items) {
    views.push(toSeasonalInsightScheduleView(item));
  }
  return views;
}

export function sumSeasonalInsightScheduleView(view: SeasonalInsightScheduleView): number {
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  return parsedBatchSize + parsedAmount + parsedThreshold;
}
