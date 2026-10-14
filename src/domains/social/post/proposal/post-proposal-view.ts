import * as text from "../../../../kit/text.js";
import { PostProposal } from "./post-proposal.js";

/** How screens and exports show a post proposal. */
export class PostProposalView {
  codeText: string;
  labelText: string;
  categoryText: string;
  locale: string;
  ceiling: string;
  costText: string;
  description: string;
  source: string;
  impressionsText: string;
  minimum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    categoryText: string,
    locale: string,
    ceiling: string,
    costText: string,
    description: string,
    source: string,
    impressionsText: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.categoryText = categoryText;
    this.locale = locale;
    this.ceiling = ceiling;
    this.costText = costText;
    this.description = description;
    this.source = source;
    this.impressionsText = impressionsText;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toPostProposalView(item: PostProposal): PostProposalView {
  return new PostProposalView(
    text.truncate(item.code, 80),
    item.label,
    item.category,
    item.locale,
    item.ceiling.toFixed(2),
    item.cost.toFixed(2),
    text.truncate(item.description, 120),
    item.source,
    String(item.impressions),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPostProposalViews(items: PostProposal[]): PostProposalView[] {
  const views: PostProposalView[] = [];
  for (const item of items) {
    views.push(toPostProposalView(item));
  }
  return views;
}

export function sumPostProposalView(view: PostProposalView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedCeiling + parsedCost + parsedImpressions;
}
