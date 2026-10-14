import * as text from "../../../../kit/text.js";
import { RegionalRewardRollup } from "./regional-reward-rollup.js";

/** How screens and exports show a regional reward rollup. */
export class RegionalRewardRollupView {
  code: string;
  title: string;
  locale: string;
  score: string;
  graceDays: string;
  budgetText: string;
  minimum: string;
  startsAt: string;
  quantity: string;
  audienceId: string;
  ratioText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    locale: string,
    score: string,
    graceDays: string,
    budgetText: string,
    minimum: string,
    startsAt: string,
    quantity: string,
    audienceId: string,
    ratioText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.score = score;
    this.graceDays = graceDays;
    this.budgetText = budgetText;
    this.minimum = minimum;
    this.startsAt = startsAt;
    this.quantity = quantity;
    this.audienceId = audienceId;
    this.ratioText = ratioText;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalRewardRollupView(item: RegionalRewardRollup): RegionalRewardRollupView {
  return new RegionalRewardRollupView(
    item.code,
    text.truncate(item.title, 80),
    item.locale,
    item.score.toFixed(2),
    String(item.graceDays),
    item.budget.toFixed(2),
    item.minimum.toFixed(2),
    String(item.startsAt),
    String(item.quantity),
    item.audienceId,
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalRewardRollupViews(items: RegionalRewardRollup[]): RegionalRewardRollupView[] {
  const views: RegionalRewardRollupView[] = [];
  for (const item of items) {
    views.push(toRegionalRewardRollupView(item));
  }
  return views;
}

export function sumRegionalRewardRollupView(view: RegionalRewardRollupView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedScore + parsedGraceDays + parsedBudget;
}
