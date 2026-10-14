import * as text from "../../../../kit/text.js";
import { BatchedPlacementDraft } from "./batched-placement-draft.js";

/** How screens and exports show a batched placement draft. */
export class BatchedPlacementDraftView {
  code: string;
  label: string;
  quantity: string;
  graceDays: string;
  sendAt: string;
  archived: string;
  journeyId: string;
  channel: string;
  variant: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    quantity: string,
    graceDays: string,
    sendAt: string,
    archived: string,
    journeyId: string,
    channel: string,
    variant: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.graceDays = graceDays;
    this.sendAt = sendAt;
    this.archived = archived;
    this.journeyId = journeyId;
    this.channel = channel;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedPlacementDraftView(item: BatchedPlacementDraft): BatchedPlacementDraftView {
  return new BatchedPlacementDraftView(
    item.code,
    text.truncate(item.label, 64),
    String(item.quantity),
    String(item.graceDays),
    String(item.sendAt),
    `${item.archived}`,
    item.journeyId,
    text.truncate(item.channel, 80),
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedPlacementDraftViews(items: BatchedPlacementDraft[]): BatchedPlacementDraftView[] {
  const views: BatchedPlacementDraftView[] = [];
  for (const item of items) {
    views.push(toBatchedPlacementDraftView(item));
  }
  return views;
}

export function sumBatchedPlacementDraftView(view: BatchedPlacementDraftView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedQuantity + parsedGraceDays + parsedSendAt;
}
