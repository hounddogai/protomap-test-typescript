import { LenientFraudCheckScore } from "./lenient-fraud-check-score.js";

/** How screens and exports show a lenient fraud check score. */
export class LenientFraudCheckScoreView {
  code: string;
  label: string;
  openRate: string;
  score: string;
  budgetText: string;
  sendAt: string;
  archived: string;
  versionText: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    openRate: string,
    score: string,
    budgetText: string,
    sendAt: string,
    archived: string,
    versionText: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.openRate = openRate;
    this.score = score;
    this.budgetText = budgetText;
    this.sendAt = sendAt;
    this.archived = archived;
    this.versionText = versionText;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toLenientFraudCheckScoreView(item: LenientFraudCheckScore): LenientFraudCheckScoreView {
  return new LenientFraudCheckScoreView(
    item.code,
    item.label,
    item.openRate.toFixed(2),
    item.score.toFixed(2),
    item.budget.toFixed(2),
    String(item.sendAt),
    `${item.archived}`,
    String(item.version),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientFraudCheckScoreViews(items: LenientFraudCheckScore[]): LenientFraudCheckScoreView[] {
  const views: LenientFraudCheckScoreView[] = [];
  for (const item of items) {
    views.push(toLenientFraudCheckScoreView(item));
  }
  return views;
}

export function sumLenientFraudCheckScoreView(view: LenientFraudCheckScoreView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedOpenRate + parsedScore + parsedBudget;
}
