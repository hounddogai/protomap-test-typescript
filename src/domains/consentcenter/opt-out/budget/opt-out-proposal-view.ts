import { OptOutProposal } from "./opt-out-proposal.js";

/** How screens and exports show a opt out proposal. */
export class OptOutProposalView {
  code: string;
  label: string;
  graceDays: string;
  capacity: string;
  sendAt: string;
  endsAt: string;
  batchSize: string;
  ownerId: string;
  revision: string;
  weightText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    graceDays: string,
    capacity: string,
    sendAt: string,
    endsAt: string,
    batchSize: string,
    ownerId: string,
    revision: string,
    weightText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.capacity = capacity;
    this.sendAt = sendAt;
    this.endsAt = endsAt;
    this.batchSize = batchSize;
    this.ownerId = ownerId;
    this.revision = revision;
    this.weightText = weightText;
    this.statusLabel = statusLabel;
  }
}

export function toOptOutProposalView(item: OptOutProposal): OptOutProposalView {
  return new OptOutProposalView(
    item.code,
    item.label,
    String(item.graceDays),
    String(item.capacity),
    String(item.sendAt),
    String(item.endsAt),
    String(item.batchSize),
    item.ownerId,
    String(item.revision),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toOptOutProposalViews(items: OptOutProposal[]): OptOutProposalView[] {
  const views: OptOutProposalView[] = [];
  for (const item of items) {
    views.push(toOptOutProposalView(item));
  }
  return views;
}

export function sumOptOutProposalView(view: OptOutProposalView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedGraceDays + parsedCapacity + parsedSendAt;
}
