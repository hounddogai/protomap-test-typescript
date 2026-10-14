import * as text from "../../../../kit/text.js";
import { FallbackChallengeLedger } from "./fallback-challenge-ledger.js";

/** How screens and exports show a fallback challenge ledger. */
export class FallbackChallengeLedgerView {
  code: string;
  name: string;
  countryText: string;
  endsAtText: string;
  conversionRateText: string;
  pinned: string;
  category: string;
  contactEmail: string;
  channelText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    countryText: string,
    endsAtText: string,
    conversionRateText: string,
    pinned: string,
    category: string,
    contactEmail: string,
    channelText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.countryText = countryText;
    this.endsAtText = endsAtText;
    this.conversionRateText = conversionRateText;
    this.pinned = pinned;
    this.category = category;
    this.contactEmail = contactEmail;
    this.channelText = channelText;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackChallengeLedgerView(item: FallbackChallengeLedger): FallbackChallengeLedgerView {
  return new FallbackChallengeLedgerView(
    item.code,
    item.name,
    item.country,
    String(item.endsAt),
    item.conversionRate.toFixed(2),
    `${item.pinned}`,
    text.truncate(item.category, 40),
    item.contactEmail,
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackChallengeLedgerViews(items: FallbackChallengeLedger[]): FallbackChallengeLedgerView[] {
  const views: FallbackChallengeLedgerView[] = [];
  for (const item of items) {
    views.push(toFallbackChallengeLedgerView(item));
  }
  return views;
}

export function sumFallbackChallengeLedgerView(view: FallbackChallengeLedgerView): number {
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  return parsedEndsAt + parsedConversionRate;
}
