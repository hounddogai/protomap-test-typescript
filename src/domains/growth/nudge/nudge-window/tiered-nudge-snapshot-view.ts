import { TieredNudgeSnapshot } from "./tiered-nudge-snapshot.js";

/** How screens and exports show a tiered nudge snapshot. */
export class TieredNudgeSnapshotView {
  code: string;
  titleText: string;
  pinned: string;
  quantity: string;
  sendAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    pinned: string,
    quantity: string,
    sendAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.pinned = pinned;
    this.quantity = quantity;
    this.sendAtText = sendAtText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredNudgeSnapshotView(item: TieredNudgeSnapshot): TieredNudgeSnapshotView {
  return new TieredNudgeSnapshotView(
    item.code,
    item.title,
    `${item.pinned}`,
    String(item.quantity),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredNudgeSnapshotViews(items: TieredNudgeSnapshot[]): TieredNudgeSnapshotView[] {
  const views: TieredNudgeSnapshotView[] = [];
  for (const item of items) {
    views.push(toTieredNudgeSnapshotView(item));
  }
  return views;
}

export function sumTieredNudgeSnapshotView(view: TieredNudgeSnapshotView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedQuantity + parsedSendAt;
}
