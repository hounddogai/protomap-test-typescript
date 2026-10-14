import { CappedPreferenceEntry } from "./capped-preference-entry.js";

/** How screens and exports show a capped preference entry. */
export class CappedPreferenceEntryView {
  code: string;
  label: string;
  pinned: string;
  checksumText: string;
  revisionText: string;
  timezone: string;
  startsAtText: string;
  graceDaysText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    pinned: string,
    checksumText: string,
    revisionText: string,
    timezone: string,
    startsAtText: string,
    graceDaysText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.checksumText = checksumText;
    this.revisionText = revisionText;
    this.timezone = timezone;
    this.startsAtText = startsAtText;
    this.graceDaysText = graceDaysText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedPreferenceEntryView(item: CappedPreferenceEntry): CappedPreferenceEntryView {
  return new CappedPreferenceEntryView(
    item.code,
    item.label,
    `${item.pinned}`,
    item.checksum,
    String(item.revision),
    item.timezone,
    String(item.startsAt),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedPreferenceEntryViews(items: CappedPreferenceEntry[]): CappedPreferenceEntryView[] {
  const views: CappedPreferenceEntryView[] = [];
  for (const item of items) {
    views.push(toCappedPreferenceEntryView(item));
  }
  return views;
}

export function sumCappedPreferenceEntryView(view: CappedPreferenceEntryView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  return parsedRevision + parsedStartsAt + parsedGraceDays;
}
