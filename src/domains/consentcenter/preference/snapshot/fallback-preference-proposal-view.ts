import * as text from "../../../../kit/text.js";
import { FallbackPreferenceProposal } from "./fallback-preference-proposal.js";

/** How screens and exports show a fallback preference proposal. */
export class FallbackPreferenceProposalView {
  code: string;
  titleText: string;
  channel: string;
  weightText: string;
  unit: string;
  endsAt: string;
  sequence: string;
  updatedAt: string;
  phone: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    channel: string,
    weightText: string,
    unit: string,
    endsAt: string,
    sequence: string,
    updatedAt: string,
    phone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.channel = channel;
    this.weightText = weightText;
    this.unit = unit;
    this.endsAt = endsAt;
    this.sequence = sequence;
    this.updatedAt = updatedAt;
    this.phone = phone;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackPreferenceProposalView(item: FallbackPreferenceProposal): FallbackPreferenceProposalView {
  return new FallbackPreferenceProposalView(
    text.truncate(item.code, 40),
    item.title,
    item.channel,
    item.weight.toFixed(2),
    item.unit,
    String(item.endsAt),
    String(item.sequence),
    String(item.updatedAt),
    item.phone,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackPreferenceProposalViews(items: FallbackPreferenceProposal[]): FallbackPreferenceProposalView[] {
  const views: FallbackPreferenceProposalView[] = [];
  for (const item of items) {
    views.push(toFallbackPreferenceProposalView(item));
  }
  return views;
}

export function sumFallbackPreferenceProposalView(view: FallbackPreferenceProposalView): number {
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedWeight + parsedEndsAt + parsedSequence;
}
