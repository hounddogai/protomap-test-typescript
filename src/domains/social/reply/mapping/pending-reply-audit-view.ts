import * as text from "../../../../kit/text.js";
import { PendingReplyAudit } from "./pending-reply-audit.js";

/** How screens and exports show a pending reply audit. */
export class PendingReplyAuditView {
  code: string;
  name: string;
  notes: string;
  source: string;
  channel: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    notes: string,
    source: string,
    channel: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.notes = notes;
    this.source = source;
    this.channel = channel;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toPendingReplyAuditView(item: PendingReplyAudit): PendingReplyAuditView {
  return new PendingReplyAuditView(
    text.truncate(item.code, 120),
    item.name,
    item.notes,
    text.truncate(item.source, 120),
    text.truncate(item.channel, 40),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingReplyAuditViews(items: PendingReplyAudit[]): PendingReplyAuditView[] {
  const views: PendingReplyAuditView[] = [];
  for (const item of items) {
    views.push(toPendingReplyAuditView(item));
  }
  return views;
}

export function sumPendingReplyAuditView(view: PendingReplyAuditView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedScore;
}
