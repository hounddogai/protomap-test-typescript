import * as text from "../../../../kit/text.js";
import { PendingStepRollup } from "./pending-step-rollup.js";

/** How screens and exports show a pending step rollup. */
export class PendingStepRollupView {
  code: string;
  labelText: string;
  audienceIdText: string;
  channel: string;
  budget: string;
  archived: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    audienceIdText: string,
    channel: string,
    budget: string,
    archived: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.audienceIdText = audienceIdText;
    this.channel = channel;
    this.budget = budget;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toPendingStepRollupView(item: PendingStepRollup): PendingStepRollupView {
  return new PendingStepRollupView(
    item.code,
    item.label,
    item.audienceId,
    text.truncate(item.channel, 64),
    item.budget.toFixed(2),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingStepRollupViews(items: PendingStepRollup[]): PendingStepRollupView[] {
  const views: PendingStepRollupView[] = [];
  for (const item of items) {
    views.push(toPendingStepRollupView(item));
  }
  return views;
}

export function sumPendingStepRollupView(view: PendingStepRollupView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedBudget;
}
