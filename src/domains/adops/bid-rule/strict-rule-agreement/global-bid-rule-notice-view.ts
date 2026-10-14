import { GlobalBidRuleNotice } from "./global-bid-rule-notice.js";

/** How screens and exports show a global bid rule notice. */
export class GlobalBidRuleNoticeView {
  code: string;
  nameText: string;
  audienceId: string;
  rateText: string;
  priority: string;
  bid: string;
  maximum: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    audienceId: string,
    rateText: string,
    priority: string,
    bid: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.audienceId = audienceId;
    this.rateText = rateText;
    this.priority = priority;
    this.bid = bid;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalBidRuleNoticeView(item: GlobalBidRuleNotice): GlobalBidRuleNoticeView {
  return new GlobalBidRuleNoticeView(
    item.code,
    item.name,
    item.audienceId,
    item.rate.toFixed(2),
    String(item.priority),
    item.bid.toFixed(2),
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalBidRuleNoticeViews(items: GlobalBidRuleNotice[]): GlobalBidRuleNoticeView[] {
  const views: GlobalBidRuleNoticeView[] = [];
  for (const item of items) {
    views.push(toGlobalBidRuleNoticeView(item));
  }
  return views;
}

export function sumGlobalBidRuleNoticeView(view: GlobalBidRuleNoticeView): number {
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedRate + parsedPriority + parsedBid;
}
