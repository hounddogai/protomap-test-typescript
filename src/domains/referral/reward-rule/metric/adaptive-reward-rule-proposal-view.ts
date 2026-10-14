import * as text from "../../../../kit/text.js";
import { AdaptiveRewardRuleProposal } from "./adaptive-reward-rule-proposal.js";

/** How screens and exports show a adaptive reward rule proposal. */
export class AdaptiveRewardRuleProposalView {
  code: string;
  name: string;
  bidText: string;
  ownerId: string;
  clicks: string;
  campaignRef: string;
  unit: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    bidText: string,
    ownerId: string,
    clicks: string,
    campaignRef: string,
    unit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.bidText = bidText;
    this.ownerId = ownerId;
    this.clicks = clicks;
    this.campaignRef = campaignRef;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveRewardRuleProposalView(item: AdaptiveRewardRuleProposal): AdaptiveRewardRuleProposalView {
  return new AdaptiveRewardRuleProposalView(
    item.code,
    item.name,
    item.bid.toFixed(2),
    item.ownerId,
    String(item.clicks),
    item.campaignRef,
    text.truncate(item.unit, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveRewardRuleProposalViews(items: AdaptiveRewardRuleProposal[]): AdaptiveRewardRuleProposalView[] {
  const views: AdaptiveRewardRuleProposalView[] = [];
  for (const item of items) {
    views.push(toAdaptiveRewardRuleProposalView(item));
  }
  return views;
}

export function sumAdaptiveRewardRuleProposalView(view: AdaptiveRewardRuleProposalView): number {
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedBid + parsedClicks;
}
