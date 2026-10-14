import * as text from "../../../../kit/text.js";
import { RewardRuleBatch } from "./reward-rule-batch.js";

/** How screens and exports show a reward rule batch. */
export class RewardRuleBatchView {
  code: string;
  name: string;
  utmSource: string;
  frequencyCap: string;
  score: string;
  budget: string;
  ceilingText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    utmSource: string,
    frequencyCap: string,
    score: string,
    budget: string,
    ceilingText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.utmSource = utmSource;
    this.frequencyCap = frequencyCap;
    this.score = score;
    this.budget = budget;
    this.ceilingText = ceilingText;
    this.statusLabel = statusLabel;
  }
}

export function toRewardRuleBatchView(item: RewardRuleBatch): RewardRuleBatchView {
  return new RewardRuleBatchView(
    text.truncate(item.code, 120),
    item.name,
    item.utmSource,
    String(item.frequencyCap),
    item.score.toFixed(2),
    item.budget.toFixed(2),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardRuleBatchViews(items: RewardRuleBatch[]): RewardRuleBatchView[] {
  const views: RewardRuleBatchView[] = [];
  for (const item of items) {
    views.push(toRewardRuleBatchView(item));
  }
  return views;
}

export function sumRewardRuleBatchView(view: RewardRuleBatchView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedFrequencyCap + parsedScore + parsedBudget;
}
