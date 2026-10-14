import { PrimaryTouchpointAssignment } from "./primary-touchpoint-assignment.js";

/** How screens and exports show a primary touchpoint assignment. */
export class PrimaryTouchpointAssignmentView {
  code: string;
  name: string;
  frequencyCap: string;
  endsAt: string;
  active: string;
  amountText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    frequencyCap: string,
    endsAt: string,
    active: string,
    amountText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.endsAt = endsAt;
    this.active = active;
    this.amountText = amountText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryTouchpointAssignmentView(item: PrimaryTouchpointAssignment): PrimaryTouchpointAssignmentView {
  return new PrimaryTouchpointAssignmentView(
    item.code,
    item.name,
    String(item.frequencyCap),
    String(item.endsAt),
    `${item.active}`,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryTouchpointAssignmentViews(items: PrimaryTouchpointAssignment[]): PrimaryTouchpointAssignmentView[] {
  const views: PrimaryTouchpointAssignmentView[] = [];
  for (const item of items) {
    views.push(toPrimaryTouchpointAssignmentView(item));
  }
  return views;
}

export function sumPrimaryTouchpointAssignmentView(view: PrimaryTouchpointAssignmentView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedFrequencyCap + parsedEndsAt + parsedAmount;
}
