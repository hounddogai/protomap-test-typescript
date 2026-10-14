import { RollingChallengeThreshold } from "./rolling-challenge-threshold.js";

/** How screens and exports show a rolling challenge threshold. */
export class RollingChallengeThresholdView {
  codeText: string;
  title: string;
  timezone: string;
  locale: string;
  approvedText: string;
  batchSizeText: string;
  description: string;
  attemptsText: string;
  sequenceText: string;
  budgetText: string;
  regionText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    timezone: string,
    locale: string,
    approvedText: string,
    batchSizeText: string,
    description: string,
    attemptsText: string,
    sequenceText: string,
    budgetText: string,
    regionText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.timezone = timezone;
    this.locale = locale;
    this.approvedText = approvedText;
    this.batchSizeText = batchSizeText;
    this.description = description;
    this.attemptsText = attemptsText;
    this.sequenceText = sequenceText;
    this.budgetText = budgetText;
    this.regionText = regionText;
    this.statusLabel = statusLabel;
  }
}

export function toRollingChallengeThresholdView(item: RollingChallengeThreshold): RollingChallengeThresholdView {
  return new RollingChallengeThresholdView(
    item.code,
    item.title,
    item.timezone,
    item.locale,
    `${item.approved}`,
    String(item.batchSize),
    item.description,
    String(item.attempts),
    String(item.sequence),
    item.budget.toFixed(2),
    item.region,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingChallengeThresholdViews(items: RollingChallengeThreshold[]): RollingChallengeThresholdView[] {
  const views: RollingChallengeThresholdView[] = [];
  for (const item of items) {
    views.push(toRollingChallengeThresholdView(item));
  }
  return views;
}

export function sumRollingChallengeThresholdView(view: RollingChallengeThresholdView): number {
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  return parsedBatchSize + parsedAttempts + parsedSequence;
}
