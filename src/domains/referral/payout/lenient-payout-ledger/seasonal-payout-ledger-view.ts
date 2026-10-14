import * as text from "../../../../kit/text.js";
import { SeasonalPayoutLedger } from "./seasonal-payout-ledger.js";

/** How screens and exports show a seasonal payout ledger. */
export class SeasonalPayoutLedgerView {
  codeText: string;
  title: string;
  label: string;
  channel: string;
  archivedText: string;
  priority: string;
  ratio: string;
  source: string;
  utmSourceText: string;
  durationMinutes: string;
  attempts: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    label: string,
    channel: string,
    archivedText: string,
    priority: string,
    ratio: string,
    source: string,
    utmSourceText: string,
    durationMinutes: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.label = label;
    this.channel = channel;
    this.archivedText = archivedText;
    this.priority = priority;
    this.ratio = ratio;
    this.source = source;
    this.utmSourceText = utmSourceText;
    this.durationMinutes = durationMinutes;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalPayoutLedgerView(item: SeasonalPayoutLedger): SeasonalPayoutLedgerView {
  return new SeasonalPayoutLedgerView(
    item.code,
    text.truncate(item.title, 64),
    item.label,
    item.channel,
    `${item.archived}`,
    String(item.priority),
    item.ratio.toFixed(2),
    item.source,
    item.utmSource,
    String(item.durationMinutes),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalPayoutLedgerViews(items: SeasonalPayoutLedger[]): SeasonalPayoutLedgerView[] {
  const views: SeasonalPayoutLedgerView[] = [];
  for (const item of items) {
    views.push(toSeasonalPayoutLedgerView(item));
  }
  return views;
}

export function sumSeasonalPayoutLedgerView(view: SeasonalPayoutLedgerView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedPriority + parsedRatio + parsedDurationMinutes;
}
