import { StrictRewardRuleClaim } from "./strict-reward-rule-claim.js";

/** How screens and exports show a strict reward rule claim. */
export class StrictRewardRuleClaimView {
  code: string;
  name: string;
  campaignRef: string;
  conversionRateText: string;
  startsAtText: string;
  ratioText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    conversionRateText: string,
    startsAtText: string,
    ratioText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.conversionRateText = conversionRateText;
    this.startsAtText = startsAtText;
    this.ratioText = ratioText;
    this.statusLabel = statusLabel;
  }
}

export function toStrictRewardRuleClaimView(item: StrictRewardRuleClaim): StrictRewardRuleClaimView {
  return new StrictRewardRuleClaimView(
    item.code,
    item.name,
    item.campaignRef,
    item.conversionRate.toFixed(2),
    String(item.startsAt),
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictRewardRuleClaimViews(items: StrictRewardRuleClaim[]): StrictRewardRuleClaimView[] {
  const views: StrictRewardRuleClaimView[] = [];
  for (const item of items) {
    views.push(toStrictRewardRuleClaimView(item));
  }
  return views;
}

export function sumStrictRewardRuleClaimView(view: StrictRewardRuleClaimView): number {
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  return parsedConversionRate + parsedStartsAt + parsedRatio;
}
