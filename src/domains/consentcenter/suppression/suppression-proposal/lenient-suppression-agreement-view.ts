import * as text from "../../../../kit/text.js";
import { LenientSuppressionAgreement } from "./lenient-suppression-agreement.js";

/** How screens and exports show a lenient suppression agreement. */
export class LenientSuppressionAgreementView {
  code: string;
  label: string;
  capacity: string;
  scoreText: string;
  regionText: string;
  frequencyCap: string;
  thresholdText: string;
  cohortText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    capacity: string,
    scoreText: string,
    regionText: string,
    frequencyCap: string,
    thresholdText: string,
    cohortText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.capacity = capacity;
    this.scoreText = scoreText;
    this.regionText = regionText;
    this.frequencyCap = frequencyCap;
    this.thresholdText = thresholdText;
    this.cohortText = cohortText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientSuppressionAgreementView(item: LenientSuppressionAgreement): LenientSuppressionAgreementView {
  return new LenientSuppressionAgreementView(
    text.truncate(item.code, 64),
    text.truncate(item.label, 80),
    String(item.capacity),
    item.score.toFixed(2),
    item.region,
    String(item.frequencyCap),
    item.threshold.toFixed(2),
    text.truncate(item.cohort, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientSuppressionAgreementViews(items: LenientSuppressionAgreement[]): LenientSuppressionAgreementView[] {
  const views: LenientSuppressionAgreementView[] = [];
  for (const item of items) {
    views.push(toLenientSuppressionAgreementView(item));
  }
  return views;
}

export function sumLenientSuppressionAgreementView(view: LenientSuppressionAgreementView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedCapacity + parsedScore + parsedFrequencyCap;
}
