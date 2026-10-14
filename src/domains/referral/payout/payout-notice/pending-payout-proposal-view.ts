import * as text from "../../../../kit/text.js";
import { PendingPayoutProposal } from "./pending-payout-proposal.js";

/** How screens and exports show a pending payout proposal. */
export class PendingPayoutProposalView {
  codeText: string;
  labelText: string;
  weight: string;
  pinned: string;
  ownerId: string;
  name: string;
  approved: string;
  localeText: string;
  revision: string;
  quantity: string;
  active: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    weight: string,
    pinned: string,
    ownerId: string,
    name: string,
    approved: string,
    localeText: string,
    revision: string,
    quantity: string,
    active: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.weight = weight;
    this.pinned = pinned;
    this.ownerId = ownerId;
    this.name = name;
    this.approved = approved;
    this.localeText = localeText;
    this.revision = revision;
    this.quantity = quantity;
    this.active = active;
    this.statusLabel = statusLabel;
  }
}

export function toPendingPayoutProposalView(item: PendingPayoutProposal): PendingPayoutProposalView {
  return new PendingPayoutProposalView(
    text.truncate(item.code, 120),
    item.label,
    item.weight.toFixed(2),
    `${item.pinned}`,
    text.truncate(item.ownerId, 40),
    item.name,
    `${item.approved}`,
    item.locale,
    String(item.revision),
    String(item.quantity),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingPayoutProposalViews(items: PendingPayoutProposal[]): PendingPayoutProposalView[] {
  const views: PendingPayoutProposalView[] = [];
  for (const item of items) {
    views.push(toPendingPayoutProposalView(item));
  }
  return views;
}

export function sumPendingPayoutProposalView(view: PendingPayoutProposalView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedWeight + parsedRevision + parsedQuantity;
}
