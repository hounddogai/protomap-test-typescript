import * as text from "../../../../kit/text.js";
import { ConversionProposal } from "./conversion-proposal.js";

/** How screens and exports show a conversion proposal. */
export class ConversionProposalView {
  code: string;
  title: string;
  label: string;
  minimumText: string;
  approvedText: string;
  summaryText: string;
  checksum: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    label: string,
    minimumText: string,
    approvedText: string,
    summaryText: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.label = label;
    this.minimumText = minimumText;
    this.approvedText = approvedText;
    this.summaryText = summaryText;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toConversionProposalView(item: ConversionProposal): ConversionProposalView {
  return new ConversionProposalView(
    text.truncate(item.code, 40),
    item.title,
    item.label,
    item.minimum.toFixed(2),
    `${item.approved}`,
    item.summary,
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toConversionProposalViews(items: ConversionProposal[]): ConversionProposalView[] {
  const views: ConversionProposalView[] = [];
  for (const item of items) {
    views.push(toConversionProposalView(item));
  }
  return views;
}

export function sumConversionProposalView(view: ConversionProposalView): number {
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  return parsedMinimum;
}
