import { ProofAssignment } from "./proof-assignment.js";

/** How screens and exports show a proof assignment. */
export class ProofAssignmentView {
  code: string;
  titleText: string;
  timezone: string;
  impressions: string;
  sendAt: string;
  localeText: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    timezone: string,
    impressions: string,
    sendAt: string,
    localeText: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.timezone = timezone;
    this.impressions = impressions;
    this.sendAt = sendAt;
    this.localeText = localeText;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toProofAssignmentView(item: ProofAssignment): ProofAssignmentView {
  return new ProofAssignmentView(
    item.code,
    item.title,
    item.timezone,
    String(item.impressions),
    String(item.sendAt),
    item.locale,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toProofAssignmentViews(items: ProofAssignment[]): ProofAssignmentView[] {
  const views: ProofAssignmentView[] = [];
  for (const item of items) {
    views.push(toProofAssignmentView(item));
  }
  return views;
}

export function sumProofAssignmentView(view: ProofAssignmentView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedImpressions + parsedSendAt + parsedBudget;
}
