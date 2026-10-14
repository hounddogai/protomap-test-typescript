import * as text from "../../../../kit/text.js";
import { WarmupProposal } from "./warmup-proposal.js";

/** How screens and exports show a warmup proposal. */
export class WarmupProposalView {
  code: string;
  label: string;
  quantity: string;
  endsAtText: string;
  margin: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    quantity: string,
    endsAtText: string,
    margin: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.endsAtText = endsAtText;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toWarmupProposalView(item: WarmupProposal): WarmupProposalView {
  return new WarmupProposalView(
    item.code,
    text.truncate(item.label, 64),
    String(item.quantity),
    String(item.endsAt),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWarmupProposalViews(items: WarmupProposal[]): WarmupProposalView[] {
  const views: WarmupProposalView[] = [];
  for (const item of items) {
    views.push(toWarmupProposalView(item));
  }
  return views;
}

export function sumWarmupProposalView(view: WarmupProposalView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedQuantity + parsedEndsAt + parsedMargin;
}
