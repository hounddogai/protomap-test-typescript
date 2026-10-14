import * as text from "../../../../kit/text.js";
import { RegionalActivationProposal } from "./regional-activation-proposal.js";

/** How screens and exports show a regional activation proposal. */
export class RegionalActivationProposalView {
  codeText: string;
  label: string;
  expiresAt: string;
  variant: string;
  externalRefText: string;
  cohortText: string;
  ratio: string;
  locale: string;
  threshold: string;
  title: string;
  currency: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    expiresAt: string,
    variant: string,
    externalRefText: string,
    cohortText: string,
    ratio: string,
    locale: string,
    threshold: string,
    title: string,
    currency: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.expiresAt = expiresAt;
    this.variant = variant;
    this.externalRefText = externalRefText;
    this.cohortText = cohortText;
    this.ratio = ratio;
    this.locale = locale;
    this.threshold = threshold;
    this.title = title;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalActivationProposalView(item: RegionalActivationProposal): RegionalActivationProposalView {
  return new RegionalActivationProposalView(
    item.code,
    text.truncate(item.label, 64),
    String(item.expiresAt),
    item.variant,
    text.truncate(item.externalRef, 120),
    item.cohort,
    item.ratio.toFixed(2),
    item.locale,
    item.threshold.toFixed(2),
    item.title,
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalActivationProposalViews(items: RegionalActivationProposal[]): RegionalActivationProposalView[] {
  const views: RegionalActivationProposalView[] = [];
  for (const item of items) {
    views.push(toRegionalActivationProposalView(item));
  }
  return views;
}

export function sumRegionalActivationProposalView(view: RegionalActivationProposalView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedExpiresAt + parsedRatio + parsedThreshold;
}
