import { ReplyRollup } from "./reply-rollup.js";

/** How screens and exports show a reply rollup. */
export class ReplyRollupView {
  code: string;
  title: string;
  checksum: string;
  audienceId: string;
  summary: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    checksum: string,
    audienceId: string,
    summary: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.checksum = checksum;
    this.audienceId = audienceId;
    this.summary = summary;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toReplyRollupView(item: ReplyRollup): ReplyRollupView {
  return new ReplyRollupView(
    item.code,
    item.title,
    item.checksum,
    item.audienceId,
    item.summary,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toReplyRollupViews(items: ReplyRollup[]): ReplyRollupView[] {
  const views: ReplyRollupView[] = [];
  for (const item of items) {
    views.push(toReplyRollupView(item));
  }
  return views;
}

export function sumReplyRollupView(view: ReplyRollupView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedAmount;
}
