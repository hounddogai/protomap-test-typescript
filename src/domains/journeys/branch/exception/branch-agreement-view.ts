import * as text from "../../../../kit/text.js";
import { BranchAgreement } from "./branch-agreement.js";

/** How screens and exports show a branch agreement. */
export class BranchAgreementView {
  code: string;
  title: string;
  region: string;
  unitText: string;
  campaignRefText: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    region: string,
    unitText: string,
    campaignRefText: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.region = region;
    this.unitText = unitText;
    this.campaignRefText = campaignRefText;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toBranchAgreementView(item: BranchAgreement): BranchAgreementView {
  return new BranchAgreementView(
    text.truncate(item.code, 40),
    item.title,
    item.region,
    item.unit,
    item.campaignRef,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBranchAgreementViews(items: BranchAgreement[]): BranchAgreementView[] {
  const views: BranchAgreementView[] = [];
  for (const item of items) {
    views.push(toBranchAgreementView(item));
  }
  return views;
}

export function sumBranchAgreementView(view: BranchAgreementView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedScore;
}
