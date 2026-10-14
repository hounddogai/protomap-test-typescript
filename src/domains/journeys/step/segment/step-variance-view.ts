import { StepVariance } from "./step-variance.js";

/** How screens and exports show a step variance. */
export class StepVarianceView {
  code: string;
  name: string;
  createdAtText: string;
  pinned: string;
  endsAtText: string;
  audienceId: string;
  sequence: string;
  capacity: string;
  impressions: string;
  bid: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    createdAtText: string,
    pinned: string,
    endsAtText: string,
    audienceId: string,
    sequence: string,
    capacity: string,
    impressions: string,
    bid: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.createdAtText = createdAtText;
    this.pinned = pinned;
    this.endsAtText = endsAtText;
    this.audienceId = audienceId;
    this.sequence = sequence;
    this.capacity = capacity;
    this.impressions = impressions;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toStepVarianceView(item: StepVariance): StepVarianceView {
  return new StepVarianceView(
    item.code,
    item.name,
    String(item.createdAt),
    `${item.pinned}`,
    String(item.endsAt),
    item.audienceId,
    String(item.sequence),
    String(item.capacity),
    String(item.impressions),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStepVarianceViews(items: StepVariance[]): StepVarianceView[] {
  const views: StepVarianceView[] = [];
  for (const item of items) {
    views.push(toStepVarianceView(item));
  }
  return views;
}

export function sumStepVarianceView(view: StepVarianceView): number {
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedCreatedAt + parsedEndsAt + parsedSequence;
}
