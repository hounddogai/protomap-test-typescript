import { DefaultExitRuleClaim } from "./default-exit-rule-claim.js";

/** How screens and exports show a default exit rule claim. */
export class DefaultExitRuleClaimView {
  code: string;
  label: string;
  impressions: string;
  graceDays: string;
  minimumText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    impressions: string,
    graceDays: string,
    minimumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.graceDays = graceDays;
    this.minimumText = minimumText;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultExitRuleClaimView(item: DefaultExitRuleClaim): DefaultExitRuleClaimView {
  return new DefaultExitRuleClaimView(
    item.code,
    item.label,
    String(item.impressions),
    String(item.graceDays),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultExitRuleClaimViews(items: DefaultExitRuleClaim[]): DefaultExitRuleClaimView[] {
  const views: DefaultExitRuleClaimView[] = [];
  for (const item of items) {
    views.push(toDefaultExitRuleClaimView(item));
  }
  return views;
}

export function sumDefaultExitRuleClaimView(view: DefaultExitRuleClaimView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  return parsedImpressions + parsedGraceDays + parsedMinimum;
}
