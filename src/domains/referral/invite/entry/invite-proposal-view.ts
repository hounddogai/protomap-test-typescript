import { InviteProposal } from "./invite-proposal.js";

/** How screens and exports show a invite proposal. */
export class InviteProposalView {
  code: string;
  title: string;
  ratioText: string;
  pinnedText: string;
  expiresAtText: string;
  sendAt: string;
  clicks: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    ratioText: string,
    pinnedText: string,
    expiresAtText: string,
    sendAt: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.ratioText = ratioText;
    this.pinnedText = pinnedText;
    this.expiresAtText = expiresAtText;
    this.sendAt = sendAt;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toInviteProposalView(item: InviteProposal): InviteProposalView {
  return new InviteProposalView(
    item.code,
    item.title,
    item.ratio.toFixed(2),
    `${item.pinned}`,
    String(item.expiresAt),
    String(item.sendAt),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toInviteProposalViews(items: InviteProposal[]): InviteProposalView[] {
  const views: InviteProposalView[] = [];
  for (const item of items) {
    views.push(toInviteProposalView(item));
  }
  return views;
}

export function sumInviteProposalView(view: InviteProposalView): number {
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedRatio + parsedExpiresAt + parsedSendAt;
}
