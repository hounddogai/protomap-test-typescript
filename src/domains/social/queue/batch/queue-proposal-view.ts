import * as text from "../../../../kit/text.js";
import { QueueProposal } from "./queue-proposal.js";

/** How screens and exports show a queue proposal. */
export class QueueProposalView {
  code: string;
  name: string;
  source: string;
  ratioText: string;
  expiresAt: string;
  utmSource: string;
  segmentText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    source: string,
    ratioText: string,
    expiresAt: string,
    utmSource: string,
    segmentText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.ratioText = ratioText;
    this.expiresAt = expiresAt;
    this.utmSource = utmSource;
    this.segmentText = segmentText;
    this.statusLabel = statusLabel;
  }
}

export function toQueueProposalView(item: QueueProposal): QueueProposalView {
  return new QueueProposalView(
    item.code,
    item.name,
    text.truncate(item.source, 64),
    item.ratio.toFixed(2),
    String(item.expiresAt),
    item.utmSource,
    text.truncate(item.segment, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toQueueProposalViews(items: QueueProposal[]): QueueProposalView[] {
  const views: QueueProposalView[] = [];
  for (const item of items) {
    views.push(toQueueProposalView(item));
  }
  return views;
}

export function sumQueueProposalView(view: QueueProposalView): number {
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedRatio + parsedExpiresAt;
}
