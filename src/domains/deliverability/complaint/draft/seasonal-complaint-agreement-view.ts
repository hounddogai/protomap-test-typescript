import { SeasonalComplaintAgreement } from "./seasonal-complaint-agreement.js";

/** How screens and exports show a seasonal complaint agreement. */
export class SeasonalComplaintAgreementView {
  code: string;
  nameText: string;
  endsAtText: string;
  categoryText: string;
  description: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    endsAtText: string,
    categoryText: string,
    description: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.endsAtText = endsAtText;
    this.categoryText = categoryText;
    this.description = description;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalComplaintAgreementView(item: SeasonalComplaintAgreement): SeasonalComplaintAgreementView {
  return new SeasonalComplaintAgreementView(
    item.code,
    item.name,
    String(item.endsAt),
    item.category,
    item.description,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalComplaintAgreementViews(items: SeasonalComplaintAgreement[]): SeasonalComplaintAgreementView[] {
  const views: SeasonalComplaintAgreementView[] = [];
  for (const item of items) {
    views.push(toSeasonalComplaintAgreementView(item));
  }
  return views;
}

export function sumSeasonalComplaintAgreementView(view: SeasonalComplaintAgreementView): number {
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedEndsAt + parsedBudget;
}
