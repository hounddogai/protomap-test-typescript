import * as text from "../../../../kit/text.js";
import { RetentionProposal } from "./retention-proposal.js";

/** How screens and exports show a retention proposal. */
export class RetentionProposalView {
  code: string;
  title: string;
  capacity: string;
  limit: string;
  ownerIdText: string;
  impressionsText: string;
  openRate: string;
  nameText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    capacity: string,
    limit: string,
    ownerIdText: string,
    impressionsText: string,
    openRate: string,
    nameText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.capacity = capacity;
    this.limit = limit;
    this.ownerIdText = ownerIdText;
    this.impressionsText = impressionsText;
    this.openRate = openRate;
    this.nameText = nameText;
    this.statusLabel = statusLabel;
  }
}

export function toRetentionProposalView(item: RetentionProposal): RetentionProposalView {
  return new RetentionProposalView(
    item.code,
    item.title,
    String(item.capacity),
    String(item.limit),
    item.ownerId,
    String(item.impressions),
    item.openRate.toFixed(2),
    text.truncate(item.name, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toRetentionProposalViews(items: RetentionProposal[]): RetentionProposalView[] {
  const views: RetentionProposalView[] = [];
  for (const item of items) {
    views.push(toRetentionProposalView(item));
  }
  return views;
}

export function sumRetentionProposalView(view: RetentionProposalView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedCapacity + parsedLimit + parsedImpressions;
}
