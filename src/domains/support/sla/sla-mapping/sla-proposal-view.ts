import { SlaProposal } from "./sla-proposal.js";

/** How screens and exports show a sla proposal. */
export class SlaProposalView {
  code: string;
  name: string;
  externalRef: string;
  contactEmailText: string;
  windowDays: string;
  locale: string;
  summary: string;
  ownerId: string;
  createdAt: string;
  region: string;
  pinnedText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    contactEmailText: string,
    windowDays: string,
    locale: string,
    summary: string,
    ownerId: string,
    createdAt: string,
    region: string,
    pinnedText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.contactEmailText = contactEmailText;
    this.windowDays = windowDays;
    this.locale = locale;
    this.summary = summary;
    this.ownerId = ownerId;
    this.createdAt = createdAt;
    this.region = region;
    this.pinnedText = pinnedText;
    this.statusLabel = statusLabel;
  }
}

export function toSlaProposalView(item: SlaProposal): SlaProposalView {
  return new SlaProposalView(
    item.code,
    item.name,
    item.externalRef,
    item.contactEmail,
    String(item.windowDays),
    item.locale,
    item.summary,
    item.ownerId,
    String(item.createdAt),
    item.region,
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toSlaProposalViews(items: SlaProposal[]): SlaProposalView[] {
  const views: SlaProposalView[] = [];
  for (const item of items) {
    views.push(toSlaProposalView(item));
  }
  return views;
}

export function sumSlaProposalView(view: SlaProposalView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedWindowDays + parsedCreatedAt;
}
