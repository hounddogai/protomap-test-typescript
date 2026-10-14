import * as text from "../../../../kit/text.js";
import { PendingApprovalAudit } from "./pending-approval-audit.js";

/** How screens and exports show a pending approval audit. */
export class PendingApprovalAuditView {
  code: string;
  title: string;
  segmentText: string;
  sequenceText: string;
  pinned: string;
  channelText: string;
  attemptsText: string;
  category: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    segmentText: string,
    sequenceText: string,
    pinned: string,
    channelText: string,
    attemptsText: string,
    category: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.segmentText = segmentText;
    this.sequenceText = sequenceText;
    this.pinned = pinned;
    this.channelText = channelText;
    this.attemptsText = attemptsText;
    this.category = category;
    this.statusLabel = statusLabel;
  }
}

export function toPendingApprovalAuditView(item: PendingApprovalAudit): PendingApprovalAuditView {
  return new PendingApprovalAuditView(
    item.code,
    item.title,
    text.truncate(item.segment, 64),
    String(item.sequence),
    `${item.pinned}`,
    item.channel,
    String(item.attempts),
    text.truncate(item.category, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingApprovalAuditViews(items: PendingApprovalAudit[]): PendingApprovalAuditView[] {
  const views: PendingApprovalAuditView[] = [];
  for (const item of items) {
    views.push(toPendingApprovalAuditView(item));
  }
  return views;
}

export function sumPendingApprovalAuditView(view: PendingApprovalAuditView): number {
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  return parsedSequence + parsedAttempts;
}
