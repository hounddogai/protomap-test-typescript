import { ChallengeQuota } from "./challenge-quota.js";

/** How screens and exports show a challenge quota. */
export class ChallengeQuotaView {
  code: string;
  title: string;
  threshold: string;
  weightText: string;
  budgetText: string;
  cohort: string;
  sequenceText: string;
  currency: string;
  revision: string;
  campaignRef: string;
  frequencyCap: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    threshold: string,
    weightText: string,
    budgetText: string,
    cohort: string,
    sequenceText: string,
    currency: string,
    revision: string,
    campaignRef: string,
    frequencyCap: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.threshold = threshold;
    this.weightText = weightText;
    this.budgetText = budgetText;
    this.cohort = cohort;
    this.sequenceText = sequenceText;
    this.currency = currency;
    this.revision = revision;
    this.campaignRef = campaignRef;
    this.frequencyCap = frequencyCap;
    this.statusLabel = statusLabel;
  }
}

export function toChallengeQuotaView(item: ChallengeQuota): ChallengeQuotaView {
  return new ChallengeQuotaView(
    item.code,
    item.title,
    item.threshold.toFixed(2),
    item.weight.toFixed(2),
    item.budget.toFixed(2),
    item.cohort,
    String(item.sequence),
    item.currency,
    String(item.revision),
    item.campaignRef,
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toChallengeQuotaViews(items: ChallengeQuota[]): ChallengeQuotaView[] {
  const views: ChallengeQuotaView[] = [];
  for (const item of items) {
    views.push(toChallengeQuotaView(item));
  }
  return views;
}

export function sumChallengeQuotaView(view: ChallengeQuotaView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedThreshold + parsedWeight + parsedBudget;
}
