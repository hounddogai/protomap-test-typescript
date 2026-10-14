import * as text from "../../../../kit/text.js";
import { LenientTierProposal } from "./lenient-tier-proposal.js";

/** How screens and exports show a lenient tier proposal. */
export class LenientTierProposalView {
  codeText: string;
  name: string;
  cohort: string;
  source: string;
  windowDays: string;
  countryText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    cohort: string,
    source: string,
    windowDays: string,
    countryText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.cohort = cohort;
    this.source = source;
    this.windowDays = windowDays;
    this.countryText = countryText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientTierProposalView(item: LenientTierProposal): LenientTierProposalView {
  return new LenientTierProposalView(
    item.code,
    item.name,
    item.cohort,
    text.truncate(item.source, 40),
    String(item.windowDays),
    text.truncate(item.country, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientTierProposalViews(items: LenientTierProposal[]): LenientTierProposalView[] {
  const views: LenientTierProposalView[] = [];
  for (const item of items) {
    views.push(toLenientTierProposalView(item));
  }
  return views;
}

export function sumLenientTierProposalView(view: LenientTierProposalView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedWindowDays;
}
