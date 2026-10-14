import * as text from "../../../../kit/text.js";
import { ScheduledMacroSnapshot } from "./scheduled-macro-snapshot.js";

/** How screens and exports show a scheduled macro snapshot. */
export class ScheduledMacroSnapshotView {
  code: string;
  label: string;
  channelText: string;
  contactEmailText: string;
  ratio: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    channelText: string,
    contactEmailText: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.channelText = channelText;
    this.contactEmailText = contactEmailText;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledMacroSnapshotView(item: ScheduledMacroSnapshot): ScheduledMacroSnapshotView {
  return new ScheduledMacroSnapshotView(
    item.code,
    text.truncate(item.label, 40),
    item.channel,
    text.truncate(item.contactEmail, 40),
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledMacroSnapshotViews(items: ScheduledMacroSnapshot[]): ScheduledMacroSnapshotView[] {
  const views: ScheduledMacroSnapshotView[] = [];
  for (const item of items) {
    views.push(toScheduledMacroSnapshotView(item));
  }
  return views;
}

export function sumScheduledMacroSnapshotView(view: ScheduledMacroSnapshotView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedRatio;
}
