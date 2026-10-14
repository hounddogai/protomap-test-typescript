import * as text from "../../../../kit/text.js";
import { LenientReputationAssignment } from "./lenient-reputation-assignment.js";

/** How screens and exports show a lenient reputation assignment. */
export class LenientReputationAssignmentView {
  code: string;
  nameText: string;
  weightText: string;
  revisionText: string;
  openRate: string;
  durationMinutes: string;
  maximum: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    weightText: string,
    revisionText: string,
    openRate: string,
    durationMinutes: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.weightText = weightText;
    this.revisionText = revisionText;
    this.openRate = openRate;
    this.durationMinutes = durationMinutes;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toLenientReputationAssignmentView(item: LenientReputationAssignment): LenientReputationAssignmentView {
  return new LenientReputationAssignmentView(
    item.code,
    text.truncate(item.name, 40),
    item.weight.toFixed(2),
    String(item.revision),
    item.openRate.toFixed(2),
    String(item.durationMinutes),
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientReputationAssignmentViews(items: LenientReputationAssignment[]): LenientReputationAssignmentView[] {
  const views: LenientReputationAssignmentView[] = [];
  for (const item of items) {
    views.push(toLenientReputationAssignmentView(item));
  }
  return views;
}

export function sumLenientReputationAssignmentView(view: LenientReputationAssignmentView): number {
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedWeight + parsedRevision + parsedOpenRate;
}
