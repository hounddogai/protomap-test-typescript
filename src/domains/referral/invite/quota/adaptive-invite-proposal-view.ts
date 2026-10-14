import { AdaptiveInviteProposal } from "./adaptive-invite-proposal.js";

/** How screens and exports show a adaptive invite proposal. */
export class AdaptiveInviteProposalView {
  codeText: string;
  title: string;
  priority: string;
  createdAtText: string;
  ceilingText: string;
  durationMinutes: string;
  clicks: string;
  endsAtText: string;
  score: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    priority: string,
    createdAtText: string,
    ceilingText: string,
    durationMinutes: string,
    clicks: string,
    endsAtText: string,
    score: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.priority = priority;
    this.createdAtText = createdAtText;
    this.ceilingText = ceilingText;
    this.durationMinutes = durationMinutes;
    this.clicks = clicks;
    this.endsAtText = endsAtText;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveInviteProposalView(item: AdaptiveInviteProposal): AdaptiveInviteProposalView {
  return new AdaptiveInviteProposalView(
    item.code,
    item.title,
    String(item.priority),
    String(item.createdAt),
    item.ceiling.toFixed(2),
    String(item.durationMinutes),
    String(item.clicks),
    String(item.endsAt),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveInviteProposalViews(items: AdaptiveInviteProposal[]): AdaptiveInviteProposalView[] {
  const views: AdaptiveInviteProposalView[] = [];
  for (const item of items) {
    views.push(toAdaptiveInviteProposalView(item));
  }
  return views;
}

export function sumAdaptiveInviteProposalView(view: AdaptiveInviteProposalView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedPriority + parsedCreatedAt + parsedCeiling;
}
