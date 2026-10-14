import { BatchedWaitPreference } from "./batched-wait-preference.js";

/** How screens and exports show a batched wait preference. */
export class BatchedWaitPreferenceView {
  codeText: string;
  title: string;
  countryText: string;
  activeText: string;
  ceilingText: string;
  cohort: string;
  channel: string;
  bid: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    countryText: string,
    activeText: string,
    ceilingText: string,
    cohort: string,
    channel: string,
    bid: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.countryText = countryText;
    this.activeText = activeText;
    this.ceilingText = ceilingText;
    this.cohort = cohort;
    this.channel = channel;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedWaitPreferenceView(item: BatchedWaitPreference): BatchedWaitPreferenceView {
  return new BatchedWaitPreferenceView(
    item.code,
    item.title,
    item.country,
    `${item.active}`,
    item.ceiling.toFixed(2),
    item.cohort,
    item.channel,
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedWaitPreferenceViews(items: BatchedWaitPreference[]): BatchedWaitPreferenceView[] {
  const views: BatchedWaitPreferenceView[] = [];
  for (const item of items) {
    views.push(toBatchedWaitPreferenceView(item));
  }
  return views;
}

export function sumBatchedWaitPreferenceView(view: BatchedWaitPreferenceView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedCeiling + parsedBid;
}
