import { PrimaryDomainProposal } from "./primary-domain-proposal.js";

/** How screens and exports show a primary domain proposal. */
export class PrimaryDomainProposalView {
  code: string;
  label: string;
  clicks: string;
  graceDaysText: string;
  bid: string;
  endsAtText: string;
  conversionRateText: string;
  externalRef: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    clicks: string,
    graceDaysText: string,
    bid: string,
    endsAtText: string,
    conversionRateText: string,
    externalRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.graceDaysText = graceDaysText;
    this.bid = bid;
    this.endsAtText = endsAtText;
    this.conversionRateText = conversionRateText;
    this.externalRef = externalRef;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryDomainProposalView(item: PrimaryDomainProposal): PrimaryDomainProposalView {
  return new PrimaryDomainProposalView(
    item.code,
    item.label,
    String(item.clicks),
    String(item.graceDays),
    item.bid.toFixed(2),
    String(item.endsAt),
    item.conversionRate.toFixed(2),
    item.externalRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryDomainProposalViews(items: PrimaryDomainProposal[]): PrimaryDomainProposalView[] {
  const views: PrimaryDomainProposalView[] = [];
  for (const item of items) {
    views.push(toPrimaryDomainProposalView(item));
  }
  return views;
}

export function sumPrimaryDomainProposalView(view: PrimaryDomainProposalView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedClicks + parsedGraceDays + parsedBid;
}
