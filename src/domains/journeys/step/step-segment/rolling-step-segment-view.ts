import * as text from "../../../../kit/text.js";
import { RollingStepSegment } from "./rolling-step-segment.js";

/** How screens and exports show a rolling step segment. */
export class RollingStepSegmentView {
  code: string;
  titleText: string;
  openRate: string;
  checksum: string;
  notesText: string;
  cohort: string;
  batchSize: string;
  ceiling: string;
  channel: string;
  retriesText: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    openRate: string,
    checksum: string,
    notesText: string,
    cohort: string,
    batchSize: string,
    ceiling: string,
    channel: string,
    retriesText: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.openRate = openRate;
    this.checksum = checksum;
    this.notesText = notesText;
    this.cohort = cohort;
    this.batchSize = batchSize;
    this.ceiling = ceiling;
    this.channel = channel;
    this.retriesText = retriesText;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toRollingStepSegmentView(item: RollingStepSegment): RollingStepSegmentView {
  return new RollingStepSegmentView(
    text.truncate(item.code, 40),
    item.title,
    item.openRate.toFixed(2),
    text.truncate(item.checksum, 80),
    item.notes,
    item.cohort,
    String(item.batchSize),
    item.ceiling.toFixed(2),
    text.truncate(item.channel, 40),
    String(item.retries),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingStepSegmentViews(items: RollingStepSegment[]): RollingStepSegmentView[] {
  const views: RollingStepSegmentView[] = [];
  for (const item of items) {
    views.push(toRollingStepSegmentView(item));
  }
  return views;
}

export function sumRollingStepSegmentView(view: RollingStepSegmentView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedOpenRate + parsedBatchSize + parsedCeiling;
}
