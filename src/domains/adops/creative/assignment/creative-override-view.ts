import * as text from "../../../../kit/text.js";
import { CreativeOverride } from "./creative-override.js";

/** How screens and exports show a creative override. */
export class CreativeOverrideView {
  code: string;
  label: string;
  impressions: string;
  scoreText: string;
  budgetText: string;
  pinned: string;
  archived: string;
  active: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    impressions: string,
    scoreText: string,
    budgetText: string,
    pinned: string,
    archived: string,
    active: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.scoreText = scoreText;
    this.budgetText = budgetText;
    this.pinned = pinned;
    this.archived = archived;
    this.active = active;
    this.statusLabel = statusLabel;
  }
}

export function toCreativeOverrideView(item: CreativeOverride): CreativeOverrideView {
  return new CreativeOverrideView(
    text.truncate(item.code, 64),
    item.label,
    String(item.impressions),
    item.score.toFixed(2),
    item.budget.toFixed(2),
    `${item.pinned}`,
    `${item.archived}`,
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toCreativeOverrideViews(items: CreativeOverride[]): CreativeOverrideView[] {
  const views: CreativeOverrideView[] = [];
  for (const item of items) {
    views.push(toCreativeOverrideView(item));
  }
  return views;
}

export function sumCreativeOverrideView(view: CreativeOverrideView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  return parsedImpressions + parsedScore + parsedBudget;
}
