import * as text from "../../../../kit/text.js";
import { BatchedTierGroup } from "./batched-tier-group.js";

/** How screens and exports show a batched tier group. */
export class BatchedTierGroupView {
  codeText: string;
  title: string;
  sendAt: string;
  endsAtText: string;
  openRateText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    sendAt: string,
    endsAtText: string,
    openRateText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.sendAt = sendAt;
    this.endsAtText = endsAtText;
    this.openRateText = openRateText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedTierGroupView(item: BatchedTierGroup): BatchedTierGroupView {
  return new BatchedTierGroupView(
    text.truncate(item.code, 80),
    item.title,
    String(item.sendAt),
    String(item.endsAt),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedTierGroupViews(items: BatchedTierGroup[]): BatchedTierGroupView[] {
  const views: BatchedTierGroupView[] = [];
  for (const item of items) {
    views.push(toBatchedTierGroupView(item));
  }
  return views;
}

export function sumBatchedTierGroupView(view: BatchedTierGroupView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  return parsedSendAt + parsedEndsAt + parsedOpenRate;
}
