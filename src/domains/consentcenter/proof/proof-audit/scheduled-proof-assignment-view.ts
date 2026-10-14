import * as text from "../../../../kit/text.js";
import { ScheduledProofAssignment } from "./scheduled-proof-assignment.js";

/** How screens and exports show a scheduled proof assignment. */
export class ScheduledProofAssignmentView {
  code: string;
  nameText: string;
  source: string;
  externalRef: string;
  rate: string;
  description: string;
  retries: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    source: string,
    externalRef: string,
    rate: string,
    description: string,
    retries: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.source = source;
    this.externalRef = externalRef;
    this.rate = rate;
    this.description = description;
    this.retries = retries;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledProofAssignmentView(item: ScheduledProofAssignment): ScheduledProofAssignmentView {
  return new ScheduledProofAssignmentView(
    item.code,
    item.name,
    item.source,
    item.externalRef,
    item.rate.toFixed(2),
    text.truncate(item.description, 80),
    String(item.retries),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledProofAssignmentViews(items: ScheduledProofAssignment[]): ScheduledProofAssignmentView[] {
  const views: ScheduledProofAssignmentView[] = [];
  for (const item of items) {
    views.push(toScheduledProofAssignmentView(item));
  }
  return views;
}

export function sumScheduledProofAssignmentView(view: ScheduledProofAssignmentView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedRate + parsedRetries + parsedCeiling;
}
