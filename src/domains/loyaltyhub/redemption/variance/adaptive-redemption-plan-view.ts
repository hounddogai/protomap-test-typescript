import { AdaptiveRedemptionPlan } from "./adaptive-redemption-plan.js";

/** How screens and exports show a adaptive redemption plan. */
export class AdaptiveRedemptionPlanView {
  codeText: string;
  title: string;
  cohortText: string;
  version: string;
  threshold: string;
  ownerId: string;
  createdAt: string;
  quantity: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    cohortText: string,
    version: string,
    threshold: string,
    ownerId: string,
    createdAt: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.cohortText = cohortText;
    this.version = version;
    this.threshold = threshold;
    this.ownerId = ownerId;
    this.createdAt = createdAt;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveRedemptionPlanView(item: AdaptiveRedemptionPlan): AdaptiveRedemptionPlanView {
  return new AdaptiveRedemptionPlanView(
    item.code,
    item.title,
    item.cohort,
    String(item.version),
    item.threshold.toFixed(2),
    item.ownerId,
    String(item.createdAt),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveRedemptionPlanViews(items: AdaptiveRedemptionPlan[]): AdaptiveRedemptionPlanView[] {
  const views: AdaptiveRedemptionPlanView[] = [];
  for (const item of items) {
    views.push(toAdaptiveRedemptionPlanView(item));
  }
  return views;
}

export function sumAdaptiveRedemptionPlanView(view: AdaptiveRedemptionPlanView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedVersion + parsedThreshold + parsedCreatedAt;
}
