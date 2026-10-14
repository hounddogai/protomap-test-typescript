import { WeightedJourneyAgreement } from "./weighted-journey-agreement.js";

/** How screens and exports show a weighted journey agreement. */
export class WeightedJourneyAgreementView {
  codeText: string;
  title: string;
  durationMinutesText: string;
  discountText: string;
  segmentText: string;
  approvedText: string;
  pinned: string;
  attemptsText: string;
  frequencyCap: string;
  cohortText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    durationMinutesText: string,
    discountText: string,
    segmentText: string,
    approvedText: string,
    pinned: string,
    attemptsText: string,
    frequencyCap: string,
    cohortText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.durationMinutesText = durationMinutesText;
    this.discountText = discountText;
    this.segmentText = segmentText;
    this.approvedText = approvedText;
    this.pinned = pinned;
    this.attemptsText = attemptsText;
    this.frequencyCap = frequencyCap;
    this.cohortText = cohortText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedJourneyAgreementView(item: WeightedJourneyAgreement): WeightedJourneyAgreementView {
  return new WeightedJourneyAgreementView(
    item.code,
    item.title,
    String(item.durationMinutes),
    item.discount.toFixed(2),
    item.segment,
    `${item.approved}`,
    `${item.pinned}`,
    String(item.attempts),
    String(item.frequencyCap),
    item.cohort,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedJourneyAgreementViews(items: WeightedJourneyAgreement[]): WeightedJourneyAgreementView[] {
  const views: WeightedJourneyAgreementView[] = [];
  for (const item of items) {
    views.push(toWeightedJourneyAgreementView(item));
  }
  return views;
}

export function sumWeightedJourneyAgreementView(view: WeightedJourneyAgreementView): number {
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  return parsedDurationMinutes + parsedDiscount + parsedAttempts;
}
