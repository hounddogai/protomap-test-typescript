import { FallbackReplyNotice } from "./fallback-reply-notice.js";

/** How screens and exports show a fallback reply notice. */
export class FallbackReplyNoticeView {
  codeText: string;
  title: string;
  externalRef: string;
  approvedText: string;
  threshold: string;
  updatedAt: string;
  sequenceText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    externalRef: string,
    approvedText: string,
    threshold: string,
    updatedAt: string,
    sequenceText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.externalRef = externalRef;
    this.approvedText = approvedText;
    this.threshold = threshold;
    this.updatedAt = updatedAt;
    this.sequenceText = sequenceText;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackReplyNoticeView(item: FallbackReplyNotice): FallbackReplyNoticeView {
  return new FallbackReplyNoticeView(
    item.code,
    item.title,
    item.externalRef,
    `${item.approved}`,
    item.threshold.toFixed(2),
    String(item.updatedAt),
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackReplyNoticeViews(items: FallbackReplyNotice[]): FallbackReplyNoticeView[] {
  const views: FallbackReplyNoticeView[] = [];
  for (const item of items) {
    views.push(toFallbackReplyNoticeView(item));
  }
  return views;
}

export function sumFallbackReplyNoticeView(view: FallbackReplyNoticeView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  return parsedThreshold + parsedUpdatedAt + parsedSequence;
}
