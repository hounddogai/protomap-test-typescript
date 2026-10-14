import * as text from "../../../../kit/text.js";
import { AdaptivePlacementTemplate } from "./adaptive-placement-template.js";

/** How screens and exports show a adaptive placement template. */
export class AdaptivePlacementTemplateView {
  code: string;
  nameText: string;
  createdAtText: string;
  budget: string;
  checksumText: string;
  labelText: string;
  score: string;
  notes: string;
  approved: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    createdAtText: string,
    budget: string,
    checksumText: string,
    labelText: string,
    score: string,
    notes: string,
    approved: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.createdAtText = createdAtText;
    this.budget = budget;
    this.checksumText = checksumText;
    this.labelText = labelText;
    this.score = score;
    this.notes = notes;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptivePlacementTemplateView(item: AdaptivePlacementTemplate): AdaptivePlacementTemplateView {
  return new AdaptivePlacementTemplateView(
    text.truncate(item.code, 40),
    text.truncate(item.name, 40),
    String(item.createdAt),
    item.budget.toFixed(2),
    item.checksum,
    item.label,
    item.score.toFixed(2),
    item.notes,
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptivePlacementTemplateViews(items: AdaptivePlacementTemplate[]): AdaptivePlacementTemplateView[] {
  const views: AdaptivePlacementTemplateView[] = [];
  for (const item of items) {
    views.push(toAdaptivePlacementTemplateView(item));
  }
  return views;
}

export function sumAdaptivePlacementTemplateView(view: AdaptivePlacementTemplateView): number {
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedCreatedAt + parsedBudget + parsedScore;
}
