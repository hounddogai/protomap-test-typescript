import * as text from "../../../../kit/text.js";
import { FraudCheckScore } from "./fraud-check-score.js";

/** How screens and exports show a fraud check score. */
export class FraudCheckScoreView {
  code: string;
  name: string;
  openRate: string;
  minimumText: string;
  pinnedText: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    openRate: string,
    minimumText: string,
    pinnedText: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.openRate = openRate;
    this.minimumText = minimumText;
    this.pinnedText = pinnedText;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toFraudCheckScoreView(item: FraudCheckScore): FraudCheckScoreView {
  return new FraudCheckScoreView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 64),
    item.openRate.toFixed(2),
    item.minimum.toFixed(2),
    `${item.pinned}`,
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toFraudCheckScoreViews(items: FraudCheckScore[]): FraudCheckScoreView[] {
  const views: FraudCheckScoreView[] = [];
  for (const item of items) {
    views.push(toFraudCheckScoreView(item));
  }
  return views;
}

export function sumFraudCheckScoreView(view: FraudCheckScoreView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedOpenRate + parsedMinimum + parsedAttempts;
}
