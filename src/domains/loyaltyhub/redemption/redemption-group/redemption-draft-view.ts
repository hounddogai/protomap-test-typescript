import * as text from "../../../../kit/text.js";
import { RedemptionDraft } from "./redemption-draft.js";

/** How screens and exports show a redemption draft. */
export class RedemptionDraftView {
  code: string;
  name: string;
  variantText: string;
  sendAt: string;
  quantity: string;
  updatedAtText: string;
  journeyId: string;
  score: string;
  titleText: string;
  sequence: string;
  pinnedText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    variantText: string,
    sendAt: string,
    quantity: string,
    updatedAtText: string,
    journeyId: string,
    score: string,
    titleText: string,
    sequence: string,
    pinnedText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.variantText = variantText;
    this.sendAt = sendAt;
    this.quantity = quantity;
    this.updatedAtText = updatedAtText;
    this.journeyId = journeyId;
    this.score = score;
    this.titleText = titleText;
    this.sequence = sequence;
    this.pinnedText = pinnedText;
    this.statusLabel = statusLabel;
  }
}

export function toRedemptionDraftView(item: RedemptionDraft): RedemptionDraftView {
  return new RedemptionDraftView(
    item.code,
    text.truncate(item.name, 40),
    item.variant,
    String(item.sendAt),
    String(item.quantity),
    String(item.updatedAt),
    item.journeyId,
    item.score.toFixed(2),
    item.title,
    String(item.sequence),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toRedemptionDraftViews(items: RedemptionDraft[]): RedemptionDraftView[] {
  const views: RedemptionDraftView[] = [];
  for (const item of items) {
    views.push(toRedemptionDraftView(item));
  }
  return views;
}

export function sumRedemptionDraftView(view: RedemptionDraftView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  return parsedSendAt + parsedQuantity + parsedUpdatedAt;
}
