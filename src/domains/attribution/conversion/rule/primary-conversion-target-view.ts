import * as text from "../../../../kit/text.js";
import { PrimaryConversionTarget } from "./primary-conversion-target.js";

/** How screens and exports show a primary conversion target. */
export class PrimaryConversionTargetView {
  code: string;
  title: string;
  audienceId: string;
  activeText: string;
  createdAt: string;
  impressions: string;
  frequencyCap: string;
  windowDays: string;
  budget: string;
  variant: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    audienceId: string,
    activeText: string,
    createdAt: string,
    impressions: string,
    frequencyCap: string,
    windowDays: string,
    budget: string,
    variant: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.audienceId = audienceId;
    this.activeText = activeText;
    this.createdAt = createdAt;
    this.impressions = impressions;
    this.frequencyCap = frequencyCap;
    this.windowDays = windowDays;
    this.budget = budget;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryConversionTargetView(item: PrimaryConversionTarget): PrimaryConversionTargetView {
  return new PrimaryConversionTargetView(
    item.code,
    text.truncate(item.title, 80),
    text.truncate(item.audienceId, 64),
    `${item.active}`,
    String(item.createdAt),
    String(item.impressions),
    String(item.frequencyCap),
    String(item.windowDays),
    item.budget.toFixed(2),
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryConversionTargetViews(items: PrimaryConversionTarget[]): PrimaryConversionTargetView[] {
  const views: PrimaryConversionTargetView[] = [];
  for (const item of items) {
    views.push(toPrimaryConversionTargetView(item));
  }
  return views;
}

export function sumPrimaryConversionTargetView(view: PrimaryConversionTargetView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedCreatedAt + parsedImpressions + parsedFrequencyCap;
}
