import * as text from "../../../../kit/text.js";
import { ManualWaitDigest } from "./manual-wait-digest.js";

/** How screens and exports show a manual wait digest. */
export class ManualWaitDigestView {
  codeText: string;
  label: string;
  openRateText: string;
  localeText: string;
  durationMinutes: string;
  sequence: string;
  channel: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    openRateText: string,
    localeText: string,
    durationMinutes: string,
    sequence: string,
    channel: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.openRateText = openRateText;
    this.localeText = localeText;
    this.durationMinutes = durationMinutes;
    this.sequence = sequence;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toManualWaitDigestView(item: ManualWaitDigest): ManualWaitDigestView {
  return new ManualWaitDigestView(
    text.truncate(item.code, 40),
    item.label,
    item.openRate.toFixed(2),
    item.locale,
    String(item.durationMinutes),
    String(item.sequence),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualWaitDigestViews(items: ManualWaitDigest[]): ManualWaitDigestView[] {
  const views: ManualWaitDigestView[] = [];
  for (const item of items) {
    views.push(toManualWaitDigestView(item));
  }
  return views;
}

export function sumManualWaitDigestView(view: ManualWaitDigestView): number {
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedOpenRate + parsedDurationMinutes + parsedSequence;
}
