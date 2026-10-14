import { CappedRedemptionAgreement } from "./capped-redemption-agreement.js";

/** How screens and exports show a capped redemption agreement. */
export class CappedRedemptionAgreementView {
  code: string;
  labelText: string;
  minimum: string;
  audienceId: string;
  budget: string;
  priority: string;
  locale: string;
  sourceText: string;
  limit: string;
  ratioText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    minimum: string,
    audienceId: string,
    budget: string,
    priority: string,
    locale: string,
    sourceText: string,
    limit: string,
    ratioText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.minimum = minimum;
    this.audienceId = audienceId;
    this.budget = budget;
    this.priority = priority;
    this.locale = locale;
    this.sourceText = sourceText;
    this.limit = limit;
    this.ratioText = ratioText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedRedemptionAgreementView(item: CappedRedemptionAgreement): CappedRedemptionAgreementView {
  return new CappedRedemptionAgreementView(
    item.code,
    item.label,
    item.minimum.toFixed(2),
    item.audienceId,
    item.budget.toFixed(2),
    String(item.priority),
    item.locale,
    item.source,
    String(item.limit),
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedRedemptionAgreementViews(items: CappedRedemptionAgreement[]): CappedRedemptionAgreementView[] {
  const views: CappedRedemptionAgreementView[] = [];
  for (const item of items) {
    views.push(toCappedRedemptionAgreementView(item));
  }
  return views;
}

export function sumCappedRedemptionAgreementView(view: CappedRedemptionAgreementView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedMinimum + parsedBudget + parsedPriority;
}
