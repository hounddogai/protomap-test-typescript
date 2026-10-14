import * as text from "../../../../kit/text.js";
import { TieredTicketViewBaseline } from "./tiered-ticket-view-baseline.js";

/** How screens and exports show a tiered ticket view baseline. */
export class TieredTicketViewBaselineView {
  code: string;
  name: string;
  rateText: string;
  endsAt: string;
  journeyIdText: string;
  budget: string;
  amount: string;
  title: string;
  bid: string;
  externalRefText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    rateText: string,
    endsAt: string,
    journeyIdText: string,
    budget: string,
    amount: string,
    title: string,
    bid: string,
    externalRefText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.rateText = rateText;
    this.endsAt = endsAt;
    this.journeyIdText = journeyIdText;
    this.budget = budget;
    this.amount = amount;
    this.title = title;
    this.bid = bid;
    this.externalRefText = externalRefText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredTicketViewBaselineView(item: TieredTicketViewBaseline): TieredTicketViewBaselineView {
  return new TieredTicketViewBaselineView(
    item.code,
    text.truncate(item.name, 80),
    item.rate.toFixed(2),
    String(item.endsAt),
    item.journeyId,
    item.budget.toFixed(2),
    item.amount.toFixed(2),
    item.title,
    item.bid.toFixed(2),
    item.externalRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredTicketViewBaselineViews(items: TieredTicketViewBaseline[]): TieredTicketViewBaselineView[] {
  const views: TieredTicketViewBaselineView[] = [];
  for (const item of items) {
    views.push(toTieredTicketViewBaselineView(item));
  }
  return views;
}

export function sumTieredTicketViewBaselineView(view: TieredTicketViewBaselineView): number {
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedRate + parsedEndsAt + parsedBudget;
}
