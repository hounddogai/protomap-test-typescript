import * as text from "../../../../kit/text.js";
import { RegionalPaywallSnapshot } from "./regional-paywall-snapshot.js";

/** How screens and exports show a regional paywall snapshot. */
export class RegionalPaywallSnapshotView {
  code: string;
  label: string;
  audienceId: string;
  sendAt: string;
  floorValue: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    audienceId: string,
    sendAt: string,
    floorValue: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.audienceId = audienceId;
    this.sendAt = sendAt;
    this.floorValue = floorValue;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalPaywallSnapshotView(item: RegionalPaywallSnapshot): RegionalPaywallSnapshotView {
  return new RegionalPaywallSnapshotView(
    text.truncate(item.code, 40),
    text.truncate(item.label, 40),
    item.audienceId,
    String(item.sendAt),
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalPaywallSnapshotViews(items: RegionalPaywallSnapshot[]): RegionalPaywallSnapshotView[] {
  const views: RegionalPaywallSnapshotView[] = [];
  for (const item of items) {
    views.push(toRegionalPaywallSnapshotView(item));
  }
  return views;
}

export function sumRegionalPaywallSnapshotView(view: RegionalPaywallSnapshotView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedSendAt + parsedFloorValue;
}
