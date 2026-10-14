import * as text from "../../../../kit/text.js";
import { TieredBounceOverride } from "./tiered-bounce-override.js";

/** How screens and exports show a tiered bounce override. */
export class TieredBounceOverrideView {
  code: string;
  name: string;
  channelText: string;
  sourceText: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    channelText: string,
    sourceText: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.channelText = channelText;
    this.sourceText = sourceText;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toTieredBounceOverrideView(item: TieredBounceOverride): TieredBounceOverrideView {
  return new TieredBounceOverrideView(
    item.code,
    item.name,
    item.channel,
    text.truncate(item.source, 40),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredBounceOverrideViews(items: TieredBounceOverride[]): TieredBounceOverrideView[] {
  const views: TieredBounceOverrideView[] = [];
  for (const item of items) {
    views.push(toTieredBounceOverrideView(item));
  }
  return views;
}

export function sumTieredBounceOverrideView(view: TieredBounceOverrideView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedBudget;
}
