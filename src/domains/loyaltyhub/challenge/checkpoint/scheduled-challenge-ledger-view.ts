import * as text from "../../../../kit/text.js";
import { ScheduledChallengeLedger } from "./scheduled-challenge-ledger.js";

/** How screens and exports show a scheduled challenge ledger. */
export class ScheduledChallengeLedgerView {
  codeText: string;
  title: string;
  country: string;
  ratioText: string;
  locale: string;
  revisionText: string;
  conversionRate: string;
  phone: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    country: string,
    ratioText: string,
    locale: string,
    revisionText: string,
    conversionRate: string,
    phone: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.country = country;
    this.ratioText = ratioText;
    this.locale = locale;
    this.revisionText = revisionText;
    this.conversionRate = conversionRate;
    this.phone = phone;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledChallengeLedgerView(item: ScheduledChallengeLedger): ScheduledChallengeLedgerView {
  return new ScheduledChallengeLedgerView(
    item.code,
    item.title,
    item.country,
    item.ratio.toFixed(2),
    text.truncate(item.locale, 80),
    String(item.revision),
    item.conversionRate.toFixed(2),
    item.phone,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledChallengeLedgerViews(items: ScheduledChallengeLedger[]): ScheduledChallengeLedgerView[] {
  const views: ScheduledChallengeLedgerView[] = [];
  for (const item of items) {
    views.push(toScheduledChallengeLedgerView(item));
  }
  return views;
}

export function sumScheduledChallengeLedgerView(view: ScheduledChallengeLedgerView): number {
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedRatio + parsedRevision + parsedConversionRate;
}
