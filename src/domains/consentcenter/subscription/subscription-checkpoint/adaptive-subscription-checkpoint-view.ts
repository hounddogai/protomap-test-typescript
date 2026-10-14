import { AdaptiveSubscriptionCheckpoint } from "./adaptive-subscription-checkpoint.js";

/** How screens and exports show a adaptive subscription checkpoint. */
export class AdaptiveSubscriptionCheckpointView {
  code: string;
  title: string;
  expiresAt: string;
  retries: string;
  unitText: string;
  budget: string;
  versionText: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    expiresAt: string,
    retries: string,
    unitText: string,
    budget: string,
    versionText: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAt = expiresAt;
    this.retries = retries;
    this.unitText = unitText;
    this.budget = budget;
    this.versionText = versionText;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveSubscriptionCheckpointView(item: AdaptiveSubscriptionCheckpoint): AdaptiveSubscriptionCheckpointView {
  return new AdaptiveSubscriptionCheckpointView(
    item.code,
    item.title,
    String(item.expiresAt),
    String(item.retries),
    item.unit,
    item.budget.toFixed(2),
    String(item.version),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveSubscriptionCheckpointViews(items: AdaptiveSubscriptionCheckpoint[]): AdaptiveSubscriptionCheckpointView[] {
  const views: AdaptiveSubscriptionCheckpointView[] = [];
  for (const item of items) {
    views.push(toAdaptiveSubscriptionCheckpointView(item));
  }
  return views;
}

export function sumAdaptiveSubscriptionCheckpointView(view: AdaptiveSubscriptionCheckpointView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedExpiresAt + parsedRetries + parsedBudget;
}
