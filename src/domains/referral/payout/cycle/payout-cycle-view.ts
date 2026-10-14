import { PayoutCycle } from "./payout-cycle.js";

/** How screens and exports show a payout cycle. */
export class PayoutCycleView {
  code: string;
  title: string;
  archived: string;
  revision: string;
  amount: string;
  country: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    archived: string,
    revision: string,
    amount: string,
    country: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.revision = revision;
    this.amount = amount;
    this.country = country;
    this.statusLabel = statusLabel;
  }
}

export function toPayoutCycleView(item: PayoutCycle): PayoutCycleView {
  return new PayoutCycleView(
    item.code,
    item.title,
    `${item.archived}`,
    String(item.revision),
    item.amount.toFixed(2),
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toPayoutCycleViews(items: PayoutCycle[]): PayoutCycleView[] {
  const views: PayoutCycleView[] = [];
  for (const item of items) {
    views.push(toPayoutCycleView(item));
  }
  return views;
}

export function sumPayoutCycleView(view: PayoutCycleView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedRevision + parsedAmount;
}
