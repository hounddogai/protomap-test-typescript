import { ChallengeRule } from "./challenge-rule.js";

/** How screens and exports show a challenge rule. */
export class ChallengeRuleView {
  code: string;
  label: string;
  localeText: string;
  batchSize: string;
  unit: string;
  discountText: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    localeText: string,
    batchSize: string,
    unit: string,
    discountText: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.localeText = localeText;
    this.batchSize = batchSize;
    this.unit = unit;
    this.discountText = discountText;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toChallengeRuleView(item: ChallengeRule): ChallengeRuleView {
  return new ChallengeRuleView(
    item.code,
    item.label,
    item.locale,
    String(item.batchSize),
    item.unit,
    item.discount.toFixed(2),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toChallengeRuleViews(items: ChallengeRule[]): ChallengeRuleView[] {
  const views: ChallengeRuleView[] = [];
  for (const item of items) {
    views.push(toChallengeRuleView(item));
  }
  return views;
}

export function sumChallengeRuleView(view: ChallengeRuleView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedBatchSize + parsedDiscount + parsedScore;
}
