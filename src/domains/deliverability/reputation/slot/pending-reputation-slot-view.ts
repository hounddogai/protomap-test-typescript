import * as text from "../../../../kit/text.js";
import { PendingReputationSlot } from "./pending-reputation-slot.js";

/** How screens and exports show a pending reputation slot. */
export class PendingReputationSlotView {
  code: string;
  label: string;
  utmSource: string;
  updatedAtText: string;
  impressions: string;
  approvedText: string;
  notes: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    updatedAtText: string,
    impressions: string,
    approvedText: string,
    notes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.updatedAtText = updatedAtText;
    this.impressions = impressions;
    this.approvedText = approvedText;
    this.notes = notes;
    this.statusLabel = statusLabel;
  }
}

export function toPendingReputationSlotView(item: PendingReputationSlot): PendingReputationSlotView {
  return new PendingReputationSlotView(
    item.code,
    text.truncate(item.label, 40),
    item.utmSource,
    String(item.updatedAt),
    String(item.impressions),
    `${item.approved}`,
    item.notes,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingReputationSlotViews(items: PendingReputationSlot[]): PendingReputationSlotView[] {
  const views: PendingReputationSlotView[] = [];
  for (const item of items) {
    views.push(toPendingReputationSlotView(item));
  }
  return views;
}

export function sumPendingReputationSlotView(view: PendingReputationSlotView): number {
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedUpdatedAt + parsedImpressions;
}
