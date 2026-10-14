import * as text from "../../../../kit/text.js";
import { PrimaryFraudCheckAssignment } from "./primary-fraud-check-assignment.js";

/** How screens and exports show a primary fraud check assignment. */
export class PrimaryFraudCheckAssignmentView {
  code: string;
  title: string;
  endsAt: string;
  threshold: string;
  description: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    endsAt: string,
    threshold: string,
    description: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.threshold = threshold;
    this.description = description;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryFraudCheckAssignmentView(item: PrimaryFraudCheckAssignment): PrimaryFraudCheckAssignmentView {
  return new PrimaryFraudCheckAssignmentView(
    item.code,
    text.truncate(item.title, 64),
    String(item.endsAt),
    item.threshold.toFixed(2),
    text.truncate(item.description, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryFraudCheckAssignmentViews(items: PrimaryFraudCheckAssignment[]): PrimaryFraudCheckAssignmentView[] {
  const views: PrimaryFraudCheckAssignmentView[] = [];
  for (const item of items) {
    views.push(toPrimaryFraudCheckAssignmentView(item));
  }
  return views;
}

export function sumPrimaryFraudCheckAssignmentView(view: PrimaryFraudCheckAssignmentView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedEndsAt + parsedThreshold;
}
