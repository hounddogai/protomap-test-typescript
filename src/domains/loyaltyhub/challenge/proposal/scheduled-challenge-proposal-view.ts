import * as text from "../../../../kit/text.js";
import { ScheduledChallengeProposal } from "./scheduled-challenge-proposal.js";

/** How screens and exports show a scheduled challenge proposal. */
export class ScheduledChallengeProposalView {
  code: string;
  title: string;
  discount: string;
  score: string;
  impressionsText: string;
  contactEmail: string;
  name: string;
  channelText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    discount: string,
    score: string,
    impressionsText: string,
    contactEmail: string,
    name: string,
    channelText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.discount = discount;
    this.score = score;
    this.impressionsText = impressionsText;
    this.contactEmail = contactEmail;
    this.name = name;
    this.channelText = channelText;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledChallengeProposalView(item: ScheduledChallengeProposal): ScheduledChallengeProposalView {
  return new ScheduledChallengeProposalView(
    item.code,
    item.title,
    item.discount.toFixed(2),
    item.score.toFixed(2),
    String(item.impressions),
    item.contactEmail,
    item.name,
    text.truncate(item.channel, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledChallengeProposalViews(items: ScheduledChallengeProposal[]): ScheduledChallengeProposalView[] {
  const views: ScheduledChallengeProposalView[] = [];
  for (const item of items) {
    views.push(toScheduledChallengeProposalView(item));
  }
  return views;
}

export function sumScheduledChallengeProposalView(view: ScheduledChallengeProposalView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedDiscount + parsedScore + parsedImpressions;
}
