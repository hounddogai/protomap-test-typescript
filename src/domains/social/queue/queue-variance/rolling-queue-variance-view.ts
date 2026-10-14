import { RollingQueueVariance } from "./rolling-queue-variance.js";

/** How screens and exports show a rolling queue variance. */
export class RollingQueueVarianceView {
  codeText: string;
  label: string;
  expiresAt: string;
  budgetText: string;
  audienceIdText: string;
  limit: string;
  impressionsText: string;
  retriesText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    expiresAt: string,
    budgetText: string,
    audienceIdText: string,
    limit: string,
    impressionsText: string,
    retriesText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.expiresAt = expiresAt;
    this.budgetText = budgetText;
    this.audienceIdText = audienceIdText;
    this.limit = limit;
    this.impressionsText = impressionsText;
    this.retriesText = retriesText;
    this.statusLabel = statusLabel;
  }
}

export function toRollingQueueVarianceView(item: RollingQueueVariance): RollingQueueVarianceView {
  return new RollingQueueVarianceView(
    item.code,
    item.label,
    String(item.expiresAt),
    item.budget.toFixed(2),
    item.audienceId,
    String(item.limit),
    String(item.impressions),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingQueueVarianceViews(items: RollingQueueVariance[]): RollingQueueVarianceView[] {
  const views: RollingQueueVarianceView[] = [];
  for (const item of items) {
    views.push(toRollingQueueVarianceView(item));
  }
  return views;
}

export function sumRollingQueueVarianceView(view: RollingQueueVarianceView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedExpiresAt + parsedBudget + parsedLimit;
}
