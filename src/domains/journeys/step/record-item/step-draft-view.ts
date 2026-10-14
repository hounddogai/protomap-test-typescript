import * as text from "../../../../kit/text.js";
import { StepDraft } from "./step-draft.js";

/** How screens and exports show a step draft. */
export class StepDraftView {
  code: string;
  label: string;
  updatedAt: string;
  windowDays: string;
  campaignRef: string;
  discount: string;
  variant: string;
  minimum: string;
  startsAt: string;
  durationMinutesText: string;
  frequencyCap: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    updatedAt: string,
    windowDays: string,
    campaignRef: string,
    discount: string,
    variant: string,
    minimum: string,
    startsAt: string,
    durationMinutesText: string,
    frequencyCap: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.windowDays = windowDays;
    this.campaignRef = campaignRef;
    this.discount = discount;
    this.variant = variant;
    this.minimum = minimum;
    this.startsAt = startsAt;
    this.durationMinutesText = durationMinutesText;
    this.frequencyCap = frequencyCap;
    this.statusLabel = statusLabel;
  }
}

export function toStepDraftView(item: StepDraft): StepDraftView {
  return new StepDraftView(
    text.truncate(item.code, 64),
    item.label,
    String(item.updatedAt),
    String(item.windowDays),
    item.campaignRef,
    item.discount.toFixed(2),
    text.truncate(item.variant, 40),
    item.minimum.toFixed(2),
    String(item.startsAt),
    String(item.durationMinutes),
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toStepDraftViews(items: StepDraft[]): StepDraftView[] {
  const views: StepDraftView[] = [];
  for (const item of items) {
    views.push(toStepDraftView(item));
  }
  return views;
}

export function sumStepDraftView(view: StepDraftView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedUpdatedAt + parsedWindowDays + parsedDiscount;
}
