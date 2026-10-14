import { TierMilestone } from "./tier-milestone.js";

/** How screens and exports show a tier milestone. */
export class TierMilestoneView {
  codeText: string;
  title: string;
  timezone: string;
  journeyIdText: string;
  contactEmail: string;
  maximum: string;
  budgetText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    timezone: string,
    journeyIdText: string,
    contactEmail: string,
    maximum: string,
    budgetText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.timezone = timezone;
    this.journeyIdText = journeyIdText;
    this.contactEmail = contactEmail;
    this.maximum = maximum;
    this.budgetText = budgetText;
    this.statusLabel = statusLabel;
  }
}

export function toTierMilestoneView(item: TierMilestone): TierMilestoneView {
  return new TierMilestoneView(
    item.code,
    item.title,
    item.timezone,
    item.journeyId,
    item.contactEmail,
    item.maximum.toFixed(2),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTierMilestoneViews(items: TierMilestone[]): TierMilestoneView[] {
  const views: TierMilestoneView[] = [];
  for (const item of items) {
    views.push(toTierMilestoneView(item));
  }
  return views;
}

export function sumTierMilestoneView(view: TierMilestoneView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedMaximum + parsedBudget;
}
