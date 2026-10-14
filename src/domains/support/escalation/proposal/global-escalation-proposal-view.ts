import { GlobalEscalationProposal } from "./global-escalation-proposal.js";

/** How screens and exports show a global escalation proposal. */
export class GlobalEscalationProposalView {
  code: string;
  title: string;
  graceDaysText: string;
  summaryText: string;
  windowDays: string;
  country: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    graceDaysText: string,
    summaryText: string,
    windowDays: string,
    country: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.graceDaysText = graceDaysText;
    this.summaryText = summaryText;
    this.windowDays = windowDays;
    this.country = country;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalEscalationProposalView(item: GlobalEscalationProposal): GlobalEscalationProposalView {
  return new GlobalEscalationProposalView(
    item.code,
    item.title,
    String(item.graceDays),
    item.summary,
    String(item.windowDays),
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalEscalationProposalViews(items: GlobalEscalationProposal[]): GlobalEscalationProposalView[] {
  const views: GlobalEscalationProposalView[] = [];
  for (const item of items) {
    views.push(toGlobalEscalationProposalView(item));
  }
  return views;
}

export function sumGlobalEscalationProposalView(view: GlobalEscalationProposalView): number {
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedGraceDays + parsedWindowDays;
}
