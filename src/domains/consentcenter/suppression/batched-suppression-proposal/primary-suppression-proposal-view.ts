import * as text from "../../../../kit/text.js";
import { PrimarySuppressionProposal } from "./primary-suppression-proposal.js";

/** How screens and exports show a primary suppression proposal. */
export class PrimarySuppressionProposalView {
  codeText: string;
  labelText: string;
  notes: string;
  endsAt: string;
  clicks: string;
  expiresAt: string;
  description: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    notes: string,
    endsAt: string,
    clicks: string,
    expiresAt: string,
    description: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.notes = notes;
    this.endsAt = endsAt;
    this.clicks = clicks;
    this.expiresAt = expiresAt;
    this.description = description;
    this.statusLabel = statusLabel;
  }
}

export function toPrimarySuppressionProposalView(item: PrimarySuppressionProposal): PrimarySuppressionProposalView {
  return new PrimarySuppressionProposalView(
    text.truncate(item.code, 64),
    item.label,
    item.notes,
    String(item.endsAt),
    String(item.clicks),
    String(item.expiresAt),
    item.description,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimarySuppressionProposalViews(items: PrimarySuppressionProposal[]): PrimarySuppressionProposalView[] {
  const views: PrimarySuppressionProposalView[] = [];
  for (const item of items) {
    views.push(toPrimarySuppressionProposalView(item));
  }
  return views;
}

export function sumPrimarySuppressionProposalView(view: PrimarySuppressionProposalView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedEndsAt + parsedClicks + parsedExpiresAt;
}
