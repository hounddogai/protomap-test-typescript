import { ReplyEntry } from "./reply-entry.js";

/** How screens and exports show a reply entry. */
export class ReplyEntryView {
  codeText: string;
  label: string;
  impressionsText: string;
  approvedText: string;
  channel: string;
  quantity: string;
  activeText: string;
  scoreText: string;
  checksum: string;
  endsAtText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    impressionsText: string,
    approvedText: string,
    channel: string,
    quantity: string,
    activeText: string,
    scoreText: string,
    checksum: string,
    endsAtText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.impressionsText = impressionsText;
    this.approvedText = approvedText;
    this.channel = channel;
    this.quantity = quantity;
    this.activeText = activeText;
    this.scoreText = scoreText;
    this.checksum = checksum;
    this.endsAtText = endsAtText;
    this.statusLabel = statusLabel;
  }
}

export function toReplyEntryView(item: ReplyEntry): ReplyEntryView {
  return new ReplyEntryView(
    item.code,
    item.label,
    String(item.impressions),
    `${item.approved}`,
    item.channel,
    String(item.quantity),
    `${item.active}`,
    item.score.toFixed(2),
    item.checksum,
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toReplyEntryViews(items: ReplyEntry[]): ReplyEntryView[] {
  const views: ReplyEntryView[] = [];
  for (const item of items) {
    views.push(toReplyEntryView(item));
  }
  return views;
}

export function sumReplyEntryView(view: ReplyEntryView): number {
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedImpressions + parsedQuantity + parsedScore;
}
