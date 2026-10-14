import * as text from "../../../../kit/text.js";
import { RollingBounceRequest } from "./rolling-bounce-request.js";

/** How screens and exports show a rolling bounce request. */
export class RollingBounceRequestView {
  codeText: string;
  label: string;
  budget: string;
  versionText: string;
  weight: string;
  graceDaysText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    budget: string,
    versionText: string,
    weight: string,
    graceDaysText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.budget = budget;
    this.versionText = versionText;
    this.weight = weight;
    this.graceDaysText = graceDaysText;
    this.statusLabel = statusLabel;
  }
}

export function toRollingBounceRequestView(item: RollingBounceRequest): RollingBounceRequestView {
  return new RollingBounceRequestView(
    text.truncate(item.code, 64),
    text.truncate(item.label, 64),
    item.budget.toFixed(2),
    String(item.version),
    item.weight.toFixed(2),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingBounceRequestViews(items: RollingBounceRequest[]): RollingBounceRequestView[] {
  const views: RollingBounceRequestView[] = [];
  for (const item of items) {
    views.push(toRollingBounceRequestView(item));
  }
  return views;
}

export function sumRollingBounceRequestView(view: RollingBounceRequestView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedBudget + parsedVersion + parsedWeight;
}
