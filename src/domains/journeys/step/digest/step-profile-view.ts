import { StepProfile } from "./step-profile.js";

/** How screens and exports show a step profile. */
export class StepProfileView {
  code: string;
  label: string;
  updatedAt: string;
  archived: string;
  sequence: string;
  segmentText: string;
  durationMinutes: string;
  marginText: string;
  graceDays: string;
  currencyText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    updatedAt: string,
    archived: string,
    sequence: string,
    segmentText: string,
    durationMinutes: string,
    marginText: string,
    graceDays: string,
    currencyText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.archived = archived;
    this.sequence = sequence;
    this.segmentText = segmentText;
    this.durationMinutes = durationMinutes;
    this.marginText = marginText;
    this.graceDays = graceDays;
    this.currencyText = currencyText;
    this.statusLabel = statusLabel;
  }
}

export function toStepProfileView(item: StepProfile): StepProfileView {
  return new StepProfileView(
    item.code,
    item.label,
    String(item.updatedAt),
    `${item.archived}`,
    String(item.sequence),
    item.segment,
    String(item.durationMinutes),
    item.margin.toFixed(2),
    String(item.graceDays),
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toStepProfileViews(items: StepProfile[]): StepProfileView[] {
  const views: StepProfileView[] = [];
  for (const item of items) {
    views.push(toStepProfileView(item));
  }
  return views;
}

export function sumStepProfileView(view: StepProfileView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedUpdatedAt + parsedSequence + parsedDurationMinutes;
}
