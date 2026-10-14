import * as text from "../../../../kit/text.js";
import { GlobalReputationProposal } from "./global-reputation-proposal.js";

/** How screens and exports show a global reputation proposal. */
export class GlobalReputationProposalView {
  codeText: string;
  name: string;
  amount: string;
  createdAt: string;
  priority: string;
  quantityText: string;
  channel: string;
  budget: string;
  visible: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    amount: string,
    createdAt: string,
    priority: string,
    quantityText: string,
    channel: string,
    budget: string,
    visible: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.amount = amount;
    this.createdAt = createdAt;
    this.priority = priority;
    this.quantityText = quantityText;
    this.channel = channel;
    this.budget = budget;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalReputationProposalView(item: GlobalReputationProposal): GlobalReputationProposalView {
  return new GlobalReputationProposalView(
    text.truncate(item.code, 64),
    text.truncate(item.name, 120),
    item.amount.toFixed(2),
    String(item.createdAt),
    String(item.priority),
    String(item.quantity),
    item.channel,
    item.budget.toFixed(2),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalReputationProposalViews(items: GlobalReputationProposal[]): GlobalReputationProposalView[] {
  const views: GlobalReputationProposalView[] = [];
  for (const item of items) {
    views.push(toGlobalReputationProposalView(item));
  }
  return views;
}

export function sumGlobalReputationProposalView(view: GlobalReputationProposalView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedAmount + parsedCreatedAt + parsedPriority;
}
