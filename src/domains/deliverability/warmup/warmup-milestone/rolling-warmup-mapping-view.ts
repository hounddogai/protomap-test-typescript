import * as text from "../../../../kit/text.js";
import { RollingWarmupMapping } from "./rolling-warmup-mapping.js";

/** How screens and exports show a rolling warmup mapping. */
export class RollingWarmupMappingView {
  codeText: string;
  label: string;
  limit: string;
  sequence: string;
  budget: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    limit: string,
    sequence: string,
    budget: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.limit = limit;
    this.sequence = sequence;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toRollingWarmupMappingView(item: RollingWarmupMapping): RollingWarmupMappingView {
  return new RollingWarmupMappingView(
    text.truncate(item.code, 120),
    item.label,
    String(item.limit),
    String(item.sequence),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingWarmupMappingViews(items: RollingWarmupMapping[]): RollingWarmupMappingView[] {
  const views: RollingWarmupMappingView[] = [];
  for (const item of items) {
    views.push(toRollingWarmupMappingView(item));
  }
  return views;
}

export function sumRollingWarmupMappingView(view: RollingWarmupMappingView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedLimit + parsedSequence + parsedBudget;
}
