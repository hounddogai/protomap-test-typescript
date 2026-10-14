import * as text from "../../../../kit/text.js";
import { BidRuleMapping } from "./bid-rule-mapping.js";

/** How screens and exports show a bid rule mapping. */
export class BidRuleMappingView {
  codeText: string;
  title: string;
  attempts: string;
  conversionRate: string;
  frequencyCap: string;
  ownerId: string;
  approvedText: string;
  segment: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    attempts: string,
    conversionRate: string,
    frequencyCap: string,
    ownerId: string,
    approvedText: string,
    segment: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.attempts = attempts;
    this.conversionRate = conversionRate;
    this.frequencyCap = frequencyCap;
    this.ownerId = ownerId;
    this.approvedText = approvedText;
    this.segment = segment;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toBidRuleMappingView(item: BidRuleMapping): BidRuleMappingView {
  return new BidRuleMappingView(
    item.code,
    text.truncate(item.title, 64),
    String(item.attempts),
    item.conversionRate.toFixed(2),
    String(item.frequencyCap),
    text.truncate(item.ownerId, 40),
    `${item.approved}`,
    text.truncate(item.segment, 120),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toBidRuleMappingViews(items: BidRuleMapping[]): BidRuleMappingView[] {
  const views: BidRuleMappingView[] = [];
  for (const item of items) {
    views.push(toBidRuleMappingView(item));
  }
  return views;
}

export function sumBidRuleMappingView(view: BidRuleMappingView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedAttempts + parsedConversionRate + parsedFrequencyCap;
}
