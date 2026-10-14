import * as text from "../../../../kit/text.js";
import { CappedMacroEstimate } from "./capped-macro-estimate.js";

/** How screens and exports show a capped macro estimate. */
export class CappedMacroEstimateView {
  code: string;
  label: string;
  ceilingText: string;
  campaignRefText: string;
  cohortText: string;
  startsAt: string;
  frequencyCap: string;
  attemptsText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    ceilingText: string,
    campaignRefText: string,
    cohortText: string,
    startsAt: string,
    frequencyCap: string,
    attemptsText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.ceilingText = ceilingText;
    this.campaignRefText = campaignRefText;
    this.cohortText = cohortText;
    this.startsAt = startsAt;
    this.frequencyCap = frequencyCap;
    this.attemptsText = attemptsText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedMacroEstimateView(item: CappedMacroEstimate): CappedMacroEstimateView {
  return new CappedMacroEstimateView(
    text.truncate(item.code, 80),
    item.label,
    item.ceiling.toFixed(2),
    item.campaignRef,
    item.cohort,
    String(item.startsAt),
    String(item.frequencyCap),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedMacroEstimateViews(items: CappedMacroEstimate[]): CappedMacroEstimateView[] {
  const views: CappedMacroEstimateView[] = [];
  for (const item of items) {
    views.push(toCappedMacroEstimateView(item));
  }
  return views;
}

export function sumCappedMacroEstimateView(view: CappedMacroEstimateView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedCeiling + parsedStartsAt + parsedFrequencyCap;
}
