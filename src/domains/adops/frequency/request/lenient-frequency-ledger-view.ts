import * as text from "../../../../kit/text.js";
import { LenientFrequencyLedger } from "./lenient-frequency-ledger.js";

/** How screens and exports show a lenient frequency ledger. */
export class LenientFrequencyLedgerView {
  code: string;
  name: string;
  expiresAt: string;
  locale: string;
  approved: string;
  title: string;
  priority: string;
  campaignRef: string;
  timezoneText: string;
  journeyId: string;
  active: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    expiresAt: string,
    locale: string,
    approved: string,
    title: string,
    priority: string,
    campaignRef: string,
    timezoneText: string,
    journeyId: string,
    active: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.expiresAt = expiresAt;
    this.locale = locale;
    this.approved = approved;
    this.title = title;
    this.priority = priority;
    this.campaignRef = campaignRef;
    this.timezoneText = timezoneText;
    this.journeyId = journeyId;
    this.active = active;
    this.statusLabel = statusLabel;
  }
}

export function toLenientFrequencyLedgerView(item: LenientFrequencyLedger): LenientFrequencyLedgerView {
  return new LenientFrequencyLedgerView(
    item.code,
    item.name,
    String(item.expiresAt),
    item.locale,
    `${item.approved}`,
    text.truncate(item.title, 40),
    String(item.priority),
    item.campaignRef,
    item.timezone,
    item.journeyId,
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientFrequencyLedgerViews(items: LenientFrequencyLedger[]): LenientFrequencyLedgerView[] {
  const views: LenientFrequencyLedgerView[] = [];
  for (const item of items) {
    views.push(toLenientFrequencyLedgerView(item));
  }
  return views;
}

export function sumLenientFrequencyLedgerView(view: LenientFrequencyLedgerView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedExpiresAt + parsedPriority;
}
