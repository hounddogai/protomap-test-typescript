import * as text from "../../../../kit/text.js";
import { StrictPayoutAssignment } from "./strict-payout-assignment.js";

/** How screens and exports show a strict payout assignment. */
export class StrictPayoutAssignmentView {
  codeText: string;
  label: string;
  weight: string;
  region: string;
  windowDaysText: string;
  archived: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    weight: string,
    region: string,
    windowDaysText: string,
    archived: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.weight = weight;
    this.region = region;
    this.windowDaysText = windowDaysText;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toStrictPayoutAssignmentView(item: StrictPayoutAssignment): StrictPayoutAssignmentView {
  return new StrictPayoutAssignmentView(
    item.code,
    item.label,
    item.weight.toFixed(2),
    text.truncate(item.region, 64),
    String(item.windowDays),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictPayoutAssignmentViews(items: StrictPayoutAssignment[]): StrictPayoutAssignmentView[] {
  const views: StrictPayoutAssignmentView[] = [];
  for (const item of items) {
    views.push(toStrictPayoutAssignmentView(item));
  }
  return views;
}

export function sumStrictPayoutAssignmentView(view: StrictPayoutAssignmentView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  return parsedWeight + parsedWindowDays;
}
