import { PendingApprovalAllocation } from "./pending-approval-allocation.js";

/** How screens and exports show a pending approval allocation. */
export class PendingApprovalAllocationView {
  code: string;
  nameText: string;
  localeText: string;
  visibleText: string;
  segment: string;
  expiresAt: string;
  score: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    localeText: string,
    visibleText: string,
    segment: string,
    expiresAt: string,
    score: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.localeText = localeText;
    this.visibleText = visibleText;
    this.segment = segment;
    this.expiresAt = expiresAt;
    this.score = score;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toPendingApprovalAllocationView(item: PendingApprovalAllocation): PendingApprovalAllocationView {
  return new PendingApprovalAllocationView(
    item.code,
    item.name,
    item.locale,
    `${item.visible}`,
    item.segment,
    String(item.expiresAt),
    item.score.toFixed(2),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingApprovalAllocationViews(items: PendingApprovalAllocation[]): PendingApprovalAllocationView[] {
  const views: PendingApprovalAllocationView[] = [];
  for (const item of items) {
    views.push(toPendingApprovalAllocationView(item));
  }
  return views;
}

export function sumPendingApprovalAllocationView(view: PendingApprovalAllocationView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedExpiresAt + parsedScore;
}
