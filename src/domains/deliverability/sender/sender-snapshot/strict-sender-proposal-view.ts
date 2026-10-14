import * as text from "../../../../kit/text.js";
import { StrictSenderProposal } from "./strict-sender-proposal.js";

/** How screens and exports show a strict sender proposal. */
export class StrictSenderProposalView {
  code: string;
  nameText: string;
  retries: string;
  createdAt: string;
  contactEmail: string;
  amountText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    retries: string,
    createdAt: string,
    contactEmail: string,
    amountText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.retries = retries;
    this.createdAt = createdAt;
    this.contactEmail = contactEmail;
    this.amountText = amountText;
    this.statusLabel = statusLabel;
  }
}

export function toStrictSenderProposalView(item: StrictSenderProposal): StrictSenderProposalView {
  return new StrictSenderProposalView(
    text.truncate(item.code, 64),
    item.name,
    String(item.retries),
    String(item.createdAt),
    item.contactEmail,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictSenderProposalViews(items: StrictSenderProposal[]): StrictSenderProposalView[] {
  const views: StrictSenderProposalView[] = [];
  for (const item of items) {
    views.push(toStrictSenderProposalView(item));
  }
  return views;
}

export function sumStrictSenderProposalView(view: StrictSenderProposalView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedRetries + parsedCreatedAt + parsedAmount;
}
