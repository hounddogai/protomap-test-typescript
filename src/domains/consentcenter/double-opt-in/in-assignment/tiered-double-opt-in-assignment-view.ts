import * as text from "../../../../kit/text.js";
import { TieredDoubleOptInAssignment } from "./tiered-double-opt-in-assignment.js";

/** How screens and exports show a tiered double opt in assignment. */
export class TieredDoubleOptInAssignmentView {
  codeText: string;
  name: string;
  graceDaysText: string;
  label: string;
  phone: string;
  channel: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    graceDaysText: string,
    label: string,
    phone: string,
    channel: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.graceDaysText = graceDaysText;
    this.label = label;
    this.phone = phone;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toTieredDoubleOptInAssignmentView(item: TieredDoubleOptInAssignment): TieredDoubleOptInAssignmentView {
  return new TieredDoubleOptInAssignmentView(
    text.truncate(item.code, 40),
    item.name,
    String(item.graceDays),
    item.label,
    item.phone,
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredDoubleOptInAssignmentViews(items: TieredDoubleOptInAssignment[]): TieredDoubleOptInAssignmentView[] {
  const views: TieredDoubleOptInAssignmentView[] = [];
  for (const item of items) {
    views.push(toTieredDoubleOptInAssignmentView(item));
  }
  return views;
}

export function sumTieredDoubleOptInAssignmentView(view: TieredDoubleOptInAssignmentView): number {
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  return parsedGraceDays;
}
