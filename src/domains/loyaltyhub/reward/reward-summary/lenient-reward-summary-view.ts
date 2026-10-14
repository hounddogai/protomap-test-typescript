import * as text from "../../../../kit/text.js";
import { LenientRewardSummary } from "./lenient-reward-summary.js";

/** How screens and exports show a lenient reward summary. */
export class LenientRewardSummaryView {
  code: string;
  name: string;
  visible: string;
  journeyId: string;
  budget: string;
  contactEmail: string;
  archivedText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    visible: string,
    journeyId: string,
    budget: string,
    contactEmail: string,
    archivedText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.journeyId = journeyId;
    this.budget = budget;
    this.contactEmail = contactEmail;
    this.archivedText = archivedText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientRewardSummaryView(item: LenientRewardSummary): LenientRewardSummaryView {
  return new LenientRewardSummaryView(
    text.truncate(item.code, 40),
    item.name,
    `${item.visible}`,
    text.truncate(item.journeyId, 64),
    item.budget.toFixed(2),
    item.contactEmail,
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientRewardSummaryViews(items: LenientRewardSummary[]): LenientRewardSummaryView[] {
  const views: LenientRewardSummaryView[] = [];
  for (const item of items) {
    views.push(toLenientRewardSummaryView(item));
  }
  return views;
}

export function sumLenientRewardSummaryView(view: LenientRewardSummaryView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedBudget;
}
