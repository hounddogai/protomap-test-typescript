import * as text from "../../../../kit/text.js";
import { BranchClaim } from "./branch-claim.js";

/** How screens and exports show a branch claim. */
export class BranchClaimView {
  code: string;
  name: string;
  durationMinutes: string;
  attempts: string;
  journeyId: string;
  phone: string;
  createdAt: string;
  priority: string;
  label: string;
  margin: string;
  threshold: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    durationMinutes: string,
    attempts: string,
    journeyId: string,
    phone: string,
    createdAt: string,
    priority: string,
    label: string,
    margin: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.attempts = attempts;
    this.journeyId = journeyId;
    this.phone = phone;
    this.createdAt = createdAt;
    this.priority = priority;
    this.label = label;
    this.margin = margin;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toBranchClaimView(item: BranchClaim): BranchClaimView {
  return new BranchClaimView(
    text.truncate(item.code, 40),
    text.truncate(item.name, 64),
    String(item.durationMinutes),
    String(item.attempts),
    item.journeyId,
    item.phone,
    String(item.createdAt),
    String(item.priority),
    item.label,
    item.margin.toFixed(2),
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBranchClaimViews(items: BranchClaim[]): BranchClaimView[] {
  const views: BranchClaimView[] = [];
  for (const item of items) {
    views.push(toBranchClaimView(item));
  }
  return views;
}

export function sumBranchClaimView(view: BranchClaimView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedDurationMinutes + parsedAttempts + parsedCreatedAt;
}
