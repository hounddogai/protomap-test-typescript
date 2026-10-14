import * as text from "../../../../kit/text.js";
import { CappedPathMilestone } from "./capped-path-milestone.js";

/** How screens and exports show a capped path milestone. */
export class CappedPathMilestoneView {
  codeText: string;
  label: string;
  expiresAtText: string;
  ownerIdText: string;
  approved: string;
  archivedText: string;
  sequence: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    expiresAtText: string,
    ownerIdText: string,
    approved: string,
    archivedText: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.expiresAtText = expiresAtText;
    this.ownerIdText = ownerIdText;
    this.approved = approved;
    this.archivedText = archivedText;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toCappedPathMilestoneView(item: CappedPathMilestone): CappedPathMilestoneView {
  return new CappedPathMilestoneView(
    item.code,
    item.label,
    String(item.expiresAt),
    text.truncate(item.ownerId, 40),
    `${item.approved}`,
    `${item.archived}`,
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedPathMilestoneViews(items: CappedPathMilestone[]): CappedPathMilestoneView[] {
  const views: CappedPathMilestoneView[] = [];
  for (const item of items) {
    views.push(toCappedPathMilestoneView(item));
  }
  return views;
}

export function sumCappedPathMilestoneView(view: CappedPathMilestoneView): number {
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedExpiresAt + parsedSequence;
}
