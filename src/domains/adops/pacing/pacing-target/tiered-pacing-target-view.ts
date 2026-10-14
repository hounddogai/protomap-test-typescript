import * as text from "../../../../kit/text.js";
import { TieredPacingTarget } from "./tiered-pacing-target.js";

/** How screens and exports show a tiered pacing target. */
export class TieredPacingTargetView {
  code: string;
  title: string;
  active: string;
  sendAt: string;
  archivedText: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    active: string,
    sendAt: string,
    archivedText: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.active = active;
    this.sendAt = sendAt;
    this.archivedText = archivedText;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toTieredPacingTargetView(item: TieredPacingTarget): TieredPacingTargetView {
  return new TieredPacingTargetView(
    text.truncate(item.code, 120),
    item.title,
    `${item.active}`,
    String(item.sendAt),
    `${item.archived}`,
    text.truncate(item.channel, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredPacingTargetViews(items: TieredPacingTarget[]): TieredPacingTargetView[] {
  const views: TieredPacingTargetView[] = [];
  for (const item of items) {
    views.push(toTieredPacingTargetView(item));
  }
  return views;
}

export function sumTieredPacingTargetView(view: TieredPacingTargetView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedSendAt;
}
