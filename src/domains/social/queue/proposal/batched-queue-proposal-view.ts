import * as text from "../../../../kit/text.js";
import { BatchedQueueProposal } from "./batched-queue-proposal.js";

/** How screens and exports show a batched queue proposal. */
export class BatchedQueueProposalView {
  code: string;
  title: string;
  reviewer: string;
  windowDays: string;
  expiresAtText: string;
  channelText: string;
  variant: string;
  sourceText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    reviewer: string,
    windowDays: string,
    expiresAtText: string,
    channelText: string,
    variant: string,
    sourceText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.reviewer = reviewer;
    this.windowDays = windowDays;
    this.expiresAtText = expiresAtText;
    this.channelText = channelText;
    this.variant = variant;
    this.sourceText = sourceText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedQueueProposalView(item: BatchedQueueProposal): BatchedQueueProposalView {
  return new BatchedQueueProposalView(
    text.truncate(item.code, 80),
    item.title,
    item.reviewer,
    String(item.windowDays),
    String(item.expiresAt),
    item.channel,
    text.truncate(item.variant, 80),
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedQueueProposalViews(items: BatchedQueueProposal[]): BatchedQueueProposalView[] {
  const views: BatchedQueueProposalView[] = [];
  for (const item of items) {
    views.push(toBatchedQueueProposalView(item));
  }
  return views;
}

export function sumBatchedQueueProposalView(view: BatchedQueueProposalView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  return parsedWindowDays + parsedExpiresAt;
}
