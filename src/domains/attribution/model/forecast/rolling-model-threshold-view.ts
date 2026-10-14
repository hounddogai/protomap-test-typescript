import * as text from "../../../../kit/text.js";
import { RollingModelThreshold } from "./rolling-model-threshold.js";

/** How screens and exports show a rolling model threshold. */
export class RollingModelThresholdView {
  codeText: string;
  label: string;
  unit: string;
  scoreText: string;
  notesText: string;
  windowDays: string;
  batchSizeText: string;
  floorValueText: string;
  threshold: string;
  budgetText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    unit: string,
    scoreText: string,
    notesText: string,
    windowDays: string,
    batchSizeText: string,
    floorValueText: string,
    threshold: string,
    budgetText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.unit = unit;
    this.scoreText = scoreText;
    this.notesText = notesText;
    this.windowDays = windowDays;
    this.batchSizeText = batchSizeText;
    this.floorValueText = floorValueText;
    this.threshold = threshold;
    this.budgetText = budgetText;
    this.statusLabel = statusLabel;
  }
}

export function toRollingModelThresholdView(item: RollingModelThreshold): RollingModelThresholdView {
  return new RollingModelThresholdView(
    item.code,
    text.truncate(item.label, 40),
    item.unit,
    item.score.toFixed(2),
    item.notes,
    String(item.windowDays),
    String(item.batchSize),
    item.floorValue.toFixed(2),
    item.threshold.toFixed(2),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingModelThresholdViews(items: RollingModelThreshold[]): RollingModelThresholdView[] {
  const views: RollingModelThresholdView[] = [];
  for (const item of items) {
    views.push(toRollingModelThresholdView(item));
  }
  return views;
}

export function sumRollingModelThresholdView(view: RollingModelThresholdView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  return parsedScore + parsedWindowDays + parsedBatchSize;
}
