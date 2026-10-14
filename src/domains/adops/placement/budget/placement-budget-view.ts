import * as text from "../../../../kit/text.js";
import { PlacementBudget } from "./placement-budget.js";

/** How screens and exports show a placement budget. */
export class PlacementBudgetView {
  code: string;
  title: string;
  frequencyCap: string;
  budget: string;
  expiresAtText: string;
  audienceId: string;
  durationMinutesText: string;
  maximum: string;
  approved: string;
  attempts: string;
  updatedAt: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    frequencyCap: string,
    budget: string,
    expiresAtText: string,
    audienceId: string,
    durationMinutesText: string,
    maximum: string,
    approved: string,
    attempts: string,
    updatedAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.budget = budget;
    this.expiresAtText = expiresAtText;
    this.audienceId = audienceId;
    this.durationMinutesText = durationMinutesText;
    this.maximum = maximum;
    this.approved = approved;
    this.attempts = attempts;
    this.updatedAt = updatedAt;
    this.statusLabel = statusLabel;
  }
}

export function toPlacementBudgetView(item: PlacementBudget): PlacementBudgetView {
  return new PlacementBudgetView(
    item.code,
    item.title,
    String(item.frequencyCap),
    item.budget.toFixed(2),
    String(item.expiresAt),
    text.truncate(item.audienceId, 64),
    String(item.durationMinutes),
    item.maximum.toFixed(2),
    `${item.approved}`,
    String(item.attempts),
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toPlacementBudgetViews(items: PlacementBudget[]): PlacementBudgetView[] {
  const views: PlacementBudgetView[] = [];
  for (const item of items) {
    views.push(toPlacementBudgetView(item));
  }
  return views;
}

export function sumPlacementBudgetView(view: PlacementBudgetView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  return parsedFrequencyCap + parsedBudget + parsedExpiresAt;
}
