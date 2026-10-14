import * as text from "../../../../kit/text.js";
import { BounceAssignment } from "./bounce-assignment.js";

/** How screens and exports show a bounce assignment. */
export class BounceAssignmentView {
  codeText: string;
  title: string;
  expiresAt: string;
  budget: string;
  pinned: string;
  limit: string;
  archived: string;
  label: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    expiresAt: string,
    budget: string,
    pinned: string,
    limit: string,
    archived: string,
    label: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.expiresAt = expiresAt;
    this.budget = budget;
    this.pinned = pinned;
    this.limit = limit;
    this.archived = archived;
    this.label = label;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toBounceAssignmentView(item: BounceAssignment): BounceAssignmentView {
  return new BounceAssignmentView(
    item.code,
    item.title,
    String(item.expiresAt),
    item.budget.toFixed(2),
    `${item.pinned}`,
    String(item.limit),
    `${item.archived}`,
    text.truncate(item.label, 120),
    text.truncate(item.campaignRef, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toBounceAssignmentViews(items: BounceAssignment[]): BounceAssignmentView[] {
  const views: BounceAssignmentView[] = [];
  for (const item of items) {
    views.push(toBounceAssignmentView(item));
  }
  return views;
}

export function sumBounceAssignmentView(view: BounceAssignmentView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedExpiresAt + parsedBudget + parsedLimit;
}
