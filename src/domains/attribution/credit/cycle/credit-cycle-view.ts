import { CreditCycle } from "./credit-cycle.js";

/** How screens and exports show a credit cycle. */
export class CreditCycleView {
  codeText: string;
  name: string;
  bid: string;
  channelText: string;
  statusLabel: string;

  constructor(codeText: string, name: string, bid: string, channelText: string, statusLabel: string) {
    this.codeText = codeText;
    this.name = name;
    this.bid = bid;
    this.channelText = channelText;
    this.statusLabel = statusLabel;
  }
}

export function toCreditCycleView(item: CreditCycle): CreditCycleView {
  return new CreditCycleView(item.code, item.name, item.bid.toFixed(2), item.channel, `${item.status}`.toUpperCase());
}

export function toCreditCycleViews(items: CreditCycle[]): CreditCycleView[] {
  const views: CreditCycleView[] = [];
  for (const item of items) {
    views.push(toCreditCycleView(item));
  }
  return views;
}

export function sumCreditCycleView(view: CreditCycleView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedBid;
}
