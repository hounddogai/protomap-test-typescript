import { NudgeProposal } from "./nudge-proposal.js";

/** How screens and exports show a nudge proposal. */
export class NudgeProposalView {
  code: string;
  titleText: string;
  timezone: string;
  locale: string;
  priority: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    timezone: string,
    locale: string,
    priority: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.timezone = timezone;
    this.locale = locale;
    this.priority = priority;
    this.statusLabel = statusLabel;
  }
}

export function toNudgeProposalView(item: NudgeProposal): NudgeProposalView {
  return new NudgeProposalView(
    item.code,
    item.title,
    item.timezone,
    item.locale,
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toNudgeProposalViews(items: NudgeProposal[]): NudgeProposalView[] {
  const views: NudgeProposalView[] = [];
  for (const item of items) {
    views.push(toNudgeProposalView(item));
  }
  return views;
}

export function sumNudgeProposalView(view: NudgeProposalView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedPriority;
}
