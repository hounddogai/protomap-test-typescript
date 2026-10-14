import * as text from "../../../../kit/text.js";
import { CohortProposal } from "./cohort-proposal.js";

/** How screens and exports show a cohort proposal. */
export class CohortProposalView {
  code: string;
  title: string;
  visibleText: string;
  country: string;
  source: string;
  contactEmailText: string;
  batchSize: string;
  currency: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    visibleText: string,
    country: string,
    source: string,
    contactEmailText: string,
    batchSize: string,
    currency: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.visibleText = visibleText;
    this.country = country;
    this.source = source;
    this.contactEmailText = contactEmailText;
    this.batchSize = batchSize;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toCohortProposalView(item: CohortProposal): CohortProposalView {
  return new CohortProposalView(
    item.code,
    item.title,
    `${item.visible}`,
    text.truncate(item.country, 80),
    item.source,
    item.contactEmail,
    String(item.batchSize),
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toCohortProposalViews(items: CohortProposal[]): CohortProposalView[] {
  const views: CohortProposalView[] = [];
  for (const item of items) {
    views.push(toCohortProposalView(item));
  }
  return views;
}

export function sumCohortProposalView(view: CohortProposalView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedBatchSize;
}
