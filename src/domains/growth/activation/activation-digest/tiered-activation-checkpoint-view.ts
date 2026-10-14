import * as text from "../../../../kit/text.js";
import { TieredActivationCheckpoint } from "./tiered-activation-checkpoint.js";

/** How screens and exports show a tiered activation checkpoint. */
export class TieredActivationCheckpointView {
  code: string;
  nameText: string;
  source: string;
  country: string;
  expiresAtText: string;
  budget: string;
  summary: string;
  currency: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    source: string,
    country: string,
    expiresAtText: string,
    budget: string,
    summary: string,
    currency: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.source = source;
    this.country = country;
    this.expiresAtText = expiresAtText;
    this.budget = budget;
    this.summary = summary;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toTieredActivationCheckpointView(item: TieredActivationCheckpoint): TieredActivationCheckpointView {
  return new TieredActivationCheckpointView(
    item.code,
    text.truncate(item.name, 120),
    text.truncate(item.source, 80),
    item.country,
    String(item.expiresAt),
    item.budget.toFixed(2),
    text.truncate(item.summary, 40),
    text.truncate(item.currency, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredActivationCheckpointViews(items: TieredActivationCheckpoint[]): TieredActivationCheckpointView[] {
  const views: TieredActivationCheckpointView[] = [];
  for (const item of items) {
    views.push(toTieredActivationCheckpointView(item));
  }
  return views;
}

export function sumTieredActivationCheckpointView(view: TieredActivationCheckpointView): number {
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedExpiresAt + parsedBudget;
}
