import * as text from "../../../../kit/text.js";
import { PayoutProposal } from "./payout-proposal.js";

/** How screens and exports show a payout proposal. */
export class PayoutProposalView {
  code: string;
  nameText: string;
  quantity: string;
  expiresAt: string;
  limit: string;
  amount: string;
  margin: string;
  phone: string;
  locale: string;
  budget: string;
  discount: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    quantity: string,
    expiresAt: string,
    limit: string,
    amount: string,
    margin: string,
    phone: string,
    locale: string,
    budget: string,
    discount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.quantity = quantity;
    this.expiresAt = expiresAt;
    this.limit = limit;
    this.amount = amount;
    this.margin = margin;
    this.phone = phone;
    this.locale = locale;
    this.budget = budget;
    this.discount = discount;
    this.statusLabel = statusLabel;
  }
}

export function toPayoutProposalView(item: PayoutProposal): PayoutProposalView {
  return new PayoutProposalView(
    item.code,
    item.name,
    String(item.quantity),
    String(item.expiresAt),
    String(item.limit),
    item.amount.toFixed(2),
    item.margin.toFixed(2),
    item.phone,
    text.truncate(item.locale, 64),
    item.budget.toFixed(2),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPayoutProposalViews(items: PayoutProposal[]): PayoutProposalView[] {
  const views: PayoutProposalView[] = [];
  for (const item of items) {
    views.push(toPayoutProposalView(item));
  }
  return views;
}

export function sumPayoutProposalView(view: PayoutProposalView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedQuantity + parsedExpiresAt + parsedLimit;
}
