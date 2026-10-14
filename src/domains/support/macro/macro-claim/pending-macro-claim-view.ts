import * as text from "../../../../kit/text.js";
import { PendingMacroClaim } from "./pending-macro-claim.js";

/** How screens and exports show a pending macro claim. */
export class PendingMacroClaimView {
  code: string;
  label: string;
  timezoneText: string;
  ratio: string;
  budget: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    timezoneText: string,
    ratio: string,
    budget: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.timezoneText = timezoneText;
    this.ratio = ratio;
    this.budget = budget;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toPendingMacroClaimView(item: PendingMacroClaim): PendingMacroClaimView {
  return new PendingMacroClaimView(
    item.code,
    item.label,
    item.timezone,
    item.ratio.toFixed(2),
    item.budget.toFixed(2),
    text.truncate(item.channel, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingMacroClaimViews(items: PendingMacroClaim[]): PendingMacroClaimView[] {
  const views: PendingMacroClaimView[] = [];
  for (const item of items) {
    views.push(toPendingMacroClaimView(item));
  }
  return views;
}

export function sumPendingMacroClaimView(view: PendingMacroClaimView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedRatio + parsedBudget;
}
