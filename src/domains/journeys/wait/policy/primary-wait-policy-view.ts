import * as text from "../../../../kit/text.js";
import { PrimaryWaitPolicy } from "./primary-wait-policy.js";

/** How screens and exports show a primary wait policy. */
export class PrimaryWaitPolicyView {
  code: string;
  labelText: string;
  visible: string;
  scoreText: string;
  summaryText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    visible: string,
    scoreText: string,
    summaryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.visible = visible;
    this.scoreText = scoreText;
    this.summaryText = summaryText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryWaitPolicyView(item: PrimaryWaitPolicy): PrimaryWaitPolicyView {
  return new PrimaryWaitPolicyView(
    text.truncate(item.code, 80),
    text.truncate(item.label, 120),
    `${item.visible}`,
    item.score.toFixed(2),
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryWaitPolicyViews(items: PrimaryWaitPolicy[]): PrimaryWaitPolicyView[] {
  const views: PrimaryWaitPolicyView[] = [];
  for (const item of items) {
    views.push(toPrimaryWaitPolicyView(item));
  }
  return views;
}

export function sumPrimaryWaitPolicyView(view: PrimaryWaitPolicyView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedScore;
}
