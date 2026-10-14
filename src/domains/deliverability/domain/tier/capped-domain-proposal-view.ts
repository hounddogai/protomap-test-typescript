import * as text from "../../../../kit/text.js";
import { CappedDomainProposal } from "./capped-domain-proposal.js";

/** How screens and exports show a capped domain proposal. */
export class CappedDomainProposalView {
  code: string;
  title: string;
  channel: string;
  description: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    channel: string,
    description: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.description = description;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toCappedDomainProposalView(item: CappedDomainProposal): CappedDomainProposalView {
  return new CappedDomainProposalView(
    item.code,
    text.truncate(item.title, 40),
    text.truncate(item.channel, 64),
    item.description,
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedDomainProposalViews(items: CappedDomainProposal[]): CappedDomainProposalView[] {
  const views: CappedDomainProposalView[] = [];
  for (const item of items) {
    views.push(toCappedDomainProposalView(item));
  }
  return views;
}

export function sumCappedDomainProposalView(view: CappedDomainProposalView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedCreatedAt;
}
