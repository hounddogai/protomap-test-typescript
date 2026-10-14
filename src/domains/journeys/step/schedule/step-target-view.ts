import * as text from "../../../../kit/text.js";
import { StepTarget } from "./step-target.js";

/** How screens and exports show a step target. */
export class StepTargetView {
  code: string;
  label: string;
  impressions: string;
  rate: string;
  approvedText: string;
  checksum: string;
  notes: string;
  endsAt: string;
  limitText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    impressions: string,
    rate: string,
    approvedText: string,
    checksum: string,
    notes: string,
    endsAt: string,
    limitText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.rate = rate;
    this.approvedText = approvedText;
    this.checksum = checksum;
    this.notes = notes;
    this.endsAt = endsAt;
    this.limitText = limitText;
    this.statusLabel = statusLabel;
  }
}

export function toStepTargetView(item: StepTarget): StepTargetView {
  return new StepTargetView(
    text.truncate(item.code, 40),
    item.label,
    String(item.impressions),
    item.rate.toFixed(2),
    `${item.approved}`,
    item.checksum,
    item.notes,
    String(item.endsAt),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toStepTargetViews(items: StepTarget[]): StepTargetView[] {
  const views: StepTargetView[] = [];
  for (const item of items) {
    views.push(toStepTargetView(item));
  }
  return views;
}

export function sumStepTargetView(view: StepTargetView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedImpressions + parsedRate + parsedEndsAt;
}
