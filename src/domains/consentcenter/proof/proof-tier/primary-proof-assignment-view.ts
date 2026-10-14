import { PrimaryProofAssignment } from "./primary-proof-assignment.js";

/** How screens and exports show a primary proof assignment. */
export class PrimaryProofAssignmentView {
  code: string;
  title: string;
  graceDays: string;
  externalRef: string;
  unitText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    graceDays: string,
    externalRef: string,
    unitText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.externalRef = externalRef;
    this.unitText = unitText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryProofAssignmentView(item: PrimaryProofAssignment): PrimaryProofAssignmentView {
  return new PrimaryProofAssignmentView(
    item.code,
    item.title,
    String(item.graceDays),
    item.externalRef,
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryProofAssignmentViews(items: PrimaryProofAssignment[]): PrimaryProofAssignmentView[] {
  const views: PrimaryProofAssignmentView[] = [];
  for (const item of items) {
    views.push(toPrimaryProofAssignmentView(item));
  }
  return views;
}

export function sumPrimaryProofAssignmentView(view: PrimaryProofAssignmentView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedGraceDays;
}
