import * as text from "../../../../kit/text.js";
import { RegionalPlacementTemplate } from "./regional-placement-template.js";

/** How screens and exports show a regional placement template. */
export class RegionalPlacementTemplateView {
  code: string;
  title: string;
  reviewerText: string;
  ownerIdText: string;
  budget: string;
  minimum: string;
  impressions: string;
  journeyId: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    reviewerText: string,
    ownerIdText: string,
    budget: string,
    minimum: string,
    impressions: string,
    journeyId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.reviewerText = reviewerText;
    this.ownerIdText = ownerIdText;
    this.budget = budget;
    this.minimum = minimum;
    this.impressions = impressions;
    this.journeyId = journeyId;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalPlacementTemplateView(item: RegionalPlacementTemplate): RegionalPlacementTemplateView {
  return new RegionalPlacementTemplateView(
    item.code,
    text.truncate(item.title, 80),
    item.reviewer,
    item.ownerId,
    item.budget.toFixed(2),
    item.minimum.toFixed(2),
    String(item.impressions),
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalPlacementTemplateViews(items: RegionalPlacementTemplate[]): RegionalPlacementTemplateView[] {
  const views: RegionalPlacementTemplateView[] = [];
  for (const item of items) {
    views.push(toRegionalPlacementTemplateView(item));
  }
  return views;
}

export function sumRegionalPlacementTemplateView(view: RegionalPlacementTemplateView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedBudget + parsedMinimum + parsedImpressions;
}
