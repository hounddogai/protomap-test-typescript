import { SubscriptionProposal } from "./subscription-proposal.js";

/** How screens and exports show a subscription proposal. */
export class SubscriptionProposalView {
  codeText: string;
  label: string;
  ceilingText: string;
  floorValue: string;
  createdAtText: string;
  utmSourceText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    ceilingText: string,
    floorValue: string,
    createdAtText: string,
    utmSourceText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.ceilingText = ceilingText;
    this.floorValue = floorValue;
    this.createdAtText = createdAtText;
    this.utmSourceText = utmSourceText;
    this.statusLabel = statusLabel;
  }
}

export function toSubscriptionProposalView(item: SubscriptionProposal): SubscriptionProposalView {
  return new SubscriptionProposalView(
    item.code,
    item.label,
    item.ceiling.toFixed(2),
    item.floorValue.toFixed(2),
    String(item.createdAt),
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toSubscriptionProposalViews(items: SubscriptionProposal[]): SubscriptionProposalView[] {
  const views: SubscriptionProposalView[] = [];
  for (const item of items) {
    views.push(toSubscriptionProposalView(item));
  }
  return views;
}

export function sumSubscriptionProposalView(view: SubscriptionProposalView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  return parsedCeiling + parsedFloorValue + parsedCreatedAt;
}
