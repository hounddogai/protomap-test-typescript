import * as text from "../../../../kit/text.js";
import { ManualBidRuleClaim } from "./manual-bid-rule-claim.js";

/** How screens and exports show a manual bid rule claim. */
export class ManualBidRuleClaimView {
  codeText: string;
  label: string;
  localeText: string;
  impressions: string;
  descriptionText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    localeText: string,
    impressions: string,
    descriptionText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.localeText = localeText;
    this.impressions = impressions;
    this.descriptionText = descriptionText;
    this.statusLabel = statusLabel;
  }
}

export function toManualBidRuleClaimView(item: ManualBidRuleClaim): ManualBidRuleClaimView {
  return new ManualBidRuleClaimView(
    item.code,
    item.label,
    item.locale,
    String(item.impressions),
    text.truncate(item.description, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualBidRuleClaimViews(items: ManualBidRuleClaim[]): ManualBidRuleClaimView[] {
  const views: ManualBidRuleClaimView[] = [];
  for (const item of items) {
    views.push(toManualBidRuleClaimView(item));
  }
  return views;
}

export function sumManualBidRuleClaimView(view: ManualBidRuleClaimView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedImpressions;
}
