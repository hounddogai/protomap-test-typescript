import { ScheduledSlaPlan } from "./scheduled-sla-plan.js";

/** How screens and exports show a scheduled sla plan. */
export class ScheduledSlaPlanView {
  codeText: string;
  name: string;
  amount: string;
  sequence: string;
  segment: string;
  createdAt: string;
  bid: string;
  locale: string;
  batchSizeText: string;
  score: string;
  openRate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    amount: string,
    sequence: string,
    segment: string,
    createdAt: string,
    bid: string,
    locale: string,
    batchSizeText: string,
    score: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.amount = amount;
    this.sequence = sequence;
    this.segment = segment;
    this.createdAt = createdAt;
    this.bid = bid;
    this.locale = locale;
    this.batchSizeText = batchSizeText;
    this.score = score;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledSlaPlanView(item: ScheduledSlaPlan): ScheduledSlaPlanView {
  return new ScheduledSlaPlanView(
    item.code,
    item.name,
    item.amount.toFixed(2),
    String(item.sequence),
    item.segment,
    String(item.createdAt),
    item.bid.toFixed(2),
    item.locale,
    String(item.batchSize),
    item.score.toFixed(2),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledSlaPlanViews(items: ScheduledSlaPlan[]): ScheduledSlaPlanView[] {
  const views: ScheduledSlaPlanView[] = [];
  for (const item of items) {
    views.push(toScheduledSlaPlanView(item));
  }
  return views;
}

export function sumScheduledSlaPlanView(view: ScheduledSlaPlanView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedAmount + parsedSequence + parsedCreatedAt;
}
