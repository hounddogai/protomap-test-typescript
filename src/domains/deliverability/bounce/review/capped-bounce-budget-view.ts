import * as text from "../../../../kit/text.js";
import { CappedBounceBudget } from "./capped-bounce-budget.js";

/** How screens and exports show a capped bounce budget. */
export class CappedBounceBudgetView {
  code: string;
  nameText: string;
  frequencyCap: string;
  locale: string;
  scoreText: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    frequencyCap: string,
    locale: string,
    scoreText: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.frequencyCap = frequencyCap;
    this.locale = locale;
    this.scoreText = scoreText;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toCappedBounceBudgetView(item: CappedBounceBudget): CappedBounceBudgetView {
  return new CappedBounceBudgetView(
    item.code,
    text.truncate(item.name, 64),
    String(item.frequencyCap),
    item.locale,
    item.score.toFixed(2),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedBounceBudgetViews(items: CappedBounceBudget[]): CappedBounceBudgetView[] {
  const views: CappedBounceBudgetView[] = [];
  for (const item of items) {
    views.push(toCappedBounceBudgetView(item));
  }
  return views;
}

export function sumCappedBounceBudgetView(view: CappedBounceBudgetView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedFrequencyCap + parsedScore;
}
