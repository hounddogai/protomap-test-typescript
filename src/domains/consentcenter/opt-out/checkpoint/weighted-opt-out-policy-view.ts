import * as text from "../../../../kit/text.js";
import { WeightedOptOutPolicy } from "./weighted-opt-out-policy.js";

/** How screens and exports show a weighted opt out policy. */
export class WeightedOptOutPolicyView {
  codeText: string;
  labelText: string;
  unit: string;
  impressions: string;
  country: string;
  cohort: string;
  startsAt: string;
  revision: string;
  frequencyCap: string;
  floorValue: string;
  notes: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    unit: string,
    impressions: string,
    country: string,
    cohort: string,
    startsAt: string,
    revision: string,
    frequencyCap: string,
    floorValue: string,
    notes: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.unit = unit;
    this.impressions = impressions;
    this.country = country;
    this.cohort = cohort;
    this.startsAt = startsAt;
    this.revision = revision;
    this.frequencyCap = frequencyCap;
    this.floorValue = floorValue;
    this.notes = notes;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedOptOutPolicyView(item: WeightedOptOutPolicy): WeightedOptOutPolicyView {
  return new WeightedOptOutPolicyView(
    item.code,
    text.truncate(item.label, 120),
    item.unit,
    String(item.impressions),
    item.country,
    item.cohort,
    String(item.startsAt),
    String(item.revision),
    String(item.frequencyCap),
    item.floorValue.toFixed(2),
    text.truncate(item.notes, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedOptOutPolicyViews(items: WeightedOptOutPolicy[]): WeightedOptOutPolicyView[] {
  const views: WeightedOptOutPolicyView[] = [];
  for (const item of items) {
    views.push(toWeightedOptOutPolicyView(item));
  }
  return views;
}

export function sumWeightedOptOutPolicyView(view: WeightedOptOutPolicyView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedImpressions + parsedStartsAt + parsedRevision;
}
