import { BatchedPostQuota } from "./batched-post-quota.js";

/** How screens and exports show a batched post quota. */
export class BatchedPostQuotaView {
  codeText: string;
  nameText: string;
  amount: string;
  rateText: string;
  limitText: string;
  cost: string;
  active: string;
  summary: string;
  country: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    amount: string,
    rateText: string,
    limitText: string,
    cost: string,
    active: string,
    summary: string,
    country: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.amount = amount;
    this.rateText = rateText;
    this.limitText = limitText;
    this.cost = cost;
    this.active = active;
    this.summary = summary;
    this.country = country;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedPostQuotaView(item: BatchedPostQuota): BatchedPostQuotaView {
  return new BatchedPostQuotaView(
    item.code,
    item.name,
    item.amount.toFixed(2),
    item.rate.toFixed(2),
    String(item.limit),
    item.cost.toFixed(2),
    `${item.active}`,
    item.summary,
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedPostQuotaViews(items: BatchedPostQuota[]): BatchedPostQuotaView[] {
  const views: BatchedPostQuotaView[] = [];
  for (const item of items) {
    views.push(toBatchedPostQuotaView(item));
  }
  return views;
}

export function sumBatchedPostQuotaView(view: BatchedPostQuotaView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  return parsedAmount + parsedRate + parsedLimit;
}
