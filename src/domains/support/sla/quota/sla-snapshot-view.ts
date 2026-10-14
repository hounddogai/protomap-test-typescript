import * as text from "../../../../kit/text.js";
import { SlaSnapshot } from "./sla-snapshot.js";

/** How screens and exports show a sla snapshot. */
export class SlaSnapshotView {
  codeText: string;
  name: string;
  localeText: string;
  audienceIdText: string;
  amount: string;
  durationMinutesText: string;
  pinned: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    localeText: string,
    audienceIdText: string,
    amount: string,
    durationMinutesText: string,
    pinned: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.localeText = localeText;
    this.audienceIdText = audienceIdText;
    this.amount = amount;
    this.durationMinutesText = durationMinutesText;
    this.pinned = pinned;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toSlaSnapshotView(item: SlaSnapshot): SlaSnapshotView {
  return new SlaSnapshotView(
    text.truncate(item.code, 80),
    item.name,
    item.locale,
    item.audienceId,
    item.amount.toFixed(2),
    String(item.durationMinutes),
    `${item.pinned}`,
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toSlaSnapshotViews(items: SlaSnapshot[]): SlaSnapshotView[] {
  const views: SlaSnapshotView[] = [];
  for (const item of items) {
    views.push(toSlaSnapshotView(item));
  }
  return views;
}

export function sumSlaSnapshotView(view: SlaSnapshotView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedAmount + parsedDurationMinutes + parsedSendAt;
}
