import { SenderProposal } from "./sender-proposal.js";

/** How screens and exports show a sender proposal. */
export class SenderProposalView {
  codeText: string;
  labelText: string;
  externalRef: string;
  discount: string;
  countryText: string;
  revision: string;
  descriptionText: string;
  marginText: string;
  impressionsText: string;
  campaignRefText: string;
  versionText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    externalRef: string,
    discount: string,
    countryText: string,
    revision: string,
    descriptionText: string,
    marginText: string,
    impressionsText: string,
    campaignRefText: string,
    versionText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.externalRef = externalRef;
    this.discount = discount;
    this.countryText = countryText;
    this.revision = revision;
    this.descriptionText = descriptionText;
    this.marginText = marginText;
    this.impressionsText = impressionsText;
    this.campaignRefText = campaignRefText;
    this.versionText = versionText;
    this.statusLabel = statusLabel;
  }
}

export function toSenderProposalView(item: SenderProposal): SenderProposalView {
  return new SenderProposalView(
    item.code,
    item.label,
    item.externalRef,
    item.discount.toFixed(2),
    item.country,
    String(item.revision),
    item.description,
    item.margin.toFixed(2),
    String(item.impressions),
    item.campaignRef,
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toSenderProposalViews(items: SenderProposal[]): SenderProposalView[] {
  const views: SenderProposalView[] = [];
  for (const item of items) {
    views.push(toSenderProposalView(item));
  }
  return views;
}

export function sumSenderProposalView(view: SenderProposalView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  return parsedDiscount + parsedRevision + parsedMargin;
}
