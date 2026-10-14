import { ChallengePlan } from "./challenge-plan.js";

/** How screens and exports show a challenge plan. */
export class ChallengePlanView {
  code: string;
  nameText: string;
  currency: string;
  ratio: string;
  expiresAt: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    currency: string,
    ratio: string,
    expiresAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.currency = currency;
    this.ratio = ratio;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toChallengePlanView(item: ChallengePlan): ChallengePlanView {
  return new ChallengePlanView(
    item.code,
    item.name,
    item.currency,
    item.ratio.toFixed(2),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toChallengePlanViews(items: ChallengePlan[]): ChallengePlanView[] {
  const views: ChallengePlanView[] = [];
  for (const item of items) {
    views.push(toChallengePlanView(item));
  }
  return views;
}

export function sumChallengePlanView(view: ChallengePlanView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedRatio + parsedExpiresAt;
}
