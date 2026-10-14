import { FallbackBidRuleMapping } from "./fallback-bid-rule-mapping.js";

/** How screens and exports show a fallback bid rule mapping. */
export class FallbackBidRuleMappingView {
  codeText: string;
  title: string;
  bid: string;
  notes: string;
  phone: string;
  statusLabel: string;

  constructor(codeText: string, title: string, bid: string, notes: string, phone: string, statusLabel: string) {
    this.codeText = codeText;
    this.title = title;
    this.bid = bid;
    this.notes = notes;
    this.phone = phone;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackBidRuleMappingView(item: FallbackBidRuleMapping): FallbackBidRuleMappingView {
  return new FallbackBidRuleMappingView(
    item.code,
    item.title,
    item.bid.toFixed(2),
    item.notes,
    item.phone,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackBidRuleMappingViews(items: FallbackBidRuleMapping[]): FallbackBidRuleMappingView[] {
  const views: FallbackBidRuleMappingView[] = [];
  for (const item of items) {
    views.push(toFallbackBidRuleMappingView(item));
  }
  return views;
}

export function sumFallbackBidRuleMappingView(view: FallbackBidRuleMappingView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedBid;
}
