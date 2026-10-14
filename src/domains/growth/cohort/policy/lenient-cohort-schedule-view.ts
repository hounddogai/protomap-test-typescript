import * as text from "../../../../kit/text.js";
import { LenientCohortSchedule } from "./lenient-cohort-schedule.js";

/** How screens and exports show a lenient cohort schedule. */
export class LenientCohortScheduleView {
  codeText: string;
  label: string;
  impressions: string;
  frequencyCap: string;
  budget: string;
  externalRef: string;
  channel: string;
  revision: string;
  endsAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    impressions: string,
    frequencyCap: string,
    budget: string,
    externalRef: string,
    channel: string,
    revision: string,
    endsAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.impressions = impressions;
    this.frequencyCap = frequencyCap;
    this.budget = budget;
    this.externalRef = externalRef;
    this.channel = channel;
    this.revision = revision;
    this.endsAt = endsAt;
    this.statusLabel = statusLabel;
  }
}

export function toLenientCohortScheduleView(item: LenientCohortSchedule): LenientCohortScheduleView {
  return new LenientCohortScheduleView(
    item.code,
    text.truncate(item.label, 120),
    String(item.impressions),
    String(item.frequencyCap),
    item.budget.toFixed(2),
    text.truncate(item.externalRef, 64),
    item.channel,
    String(item.revision),
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientCohortScheduleViews(items: LenientCohortSchedule[]): LenientCohortScheduleView[] {
  const views: LenientCohortScheduleView[] = [];
  for (const item of items) {
    views.push(toLenientCohortScheduleView(item));
  }
  return views;
}

export function sumLenientCohortScheduleView(view: LenientCohortScheduleView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedImpressions + parsedFrequencyCap + parsedBudget;
}
