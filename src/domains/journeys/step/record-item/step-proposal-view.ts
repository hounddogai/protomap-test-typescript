import * as text from "../../../../kit/text.js";
import { StepProposal } from "./step-proposal.js";

/** How screens and exports show a step proposal. */
export class StepProposalView {
  codeText: string;
  titleText: string;
  maximum: string;
  score: string;
  rate: string;
  reviewer: string;
  localeText: string;
  marginText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    maximum: string,
    score: string,
    rate: string,
    reviewer: string,
    localeText: string,
    marginText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.maximum = maximum;
    this.score = score;
    this.rate = rate;
    this.reviewer = reviewer;
    this.localeText = localeText;
    this.marginText = marginText;
    this.statusLabel = statusLabel;
  }
}

export function toStepProposalView(item: StepProposal): StepProposalView {
  return new StepProposalView(
    item.code,
    item.title,
    item.maximum.toFixed(2),
    item.score.toFixed(2),
    item.rate.toFixed(2),
    item.reviewer,
    text.truncate(item.locale, 40),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStepProposalViews(items: StepProposal[]): StepProposalView[] {
  const views: StepProposalView[] = [];
  for (const item of items) {
    views.push(toStepProposalView(item));
  }
  return views;
}

export function sumStepProposalView(view: StepProposalView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedMaximum + parsedScore + parsedRate;
}
