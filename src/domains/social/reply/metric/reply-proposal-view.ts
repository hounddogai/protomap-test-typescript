import * as text from "../../../../kit/text.js";
import { ReplyProposal } from "./reply-proposal.js";

/** How screens and exports show a reply proposal. */
export class ReplyProposalView {
  code: string;
  nameText: string;
  score: string;
  visible: string;
  floorValueText: string;
  discountText: string;
  descriptionText: string;
  quantity: string;
  locale: string;
  weight: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    score: string,
    visible: string,
    floorValueText: string,
    discountText: string,
    descriptionText: string,
    quantity: string,
    locale: string,
    weight: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.score = score;
    this.visible = visible;
    this.floorValueText = floorValueText;
    this.discountText = discountText;
    this.descriptionText = descriptionText;
    this.quantity = quantity;
    this.locale = locale;
    this.weight = weight;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toReplyProposalView(item: ReplyProposal): ReplyProposalView {
  return new ReplyProposalView(
    text.truncate(item.code, 80),
    item.name,
    item.score.toFixed(2),
    `${item.visible}`,
    item.floorValue.toFixed(2),
    item.discount.toFixed(2),
    item.description,
    String(item.quantity),
    item.locale,
    item.weight.toFixed(2),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toReplyProposalViews(items: ReplyProposal[]): ReplyProposalView[] {
  const views: ReplyProposalView[] = [];
  for (const item of items) {
    views.push(toReplyProposalView(item));
  }
  return views;
}

export function sumReplyProposalView(view: ReplyProposalView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  return parsedScore + parsedFloorValue + parsedDiscount;
}
