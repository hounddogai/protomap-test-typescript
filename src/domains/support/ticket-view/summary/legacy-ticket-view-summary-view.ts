import * as text from "../../../../kit/text.js";
import { LegacyTicketViewSummary } from "./legacy-ticket-view-summary.js";

/** How screens and exports show a legacy ticket view summary. */
export class LegacyTicketViewSummaryView {
  code: string;
  title: string;
  weight: string;
  locale: string;
  budget: string;
  conversionRate: string;
  threshold: string;
  endsAt: string;
  impressionsText: string;
  bid: string;
  priority: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    weight: string,
    locale: string,
    budget: string,
    conversionRate: string,
    threshold: string,
    endsAt: string,
    impressionsText: string,
    bid: string,
    priority: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.weight = weight;
    this.locale = locale;
    this.budget = budget;
    this.conversionRate = conversionRate;
    this.threshold = threshold;
    this.endsAt = endsAt;
    this.impressionsText = impressionsText;
    this.bid = bid;
    this.priority = priority;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyTicketViewSummaryView(item: LegacyTicketViewSummary): LegacyTicketViewSummaryView {
  return new LegacyTicketViewSummaryView(
    item.code,
    item.title,
    item.weight.toFixed(2),
    text.truncate(item.locale, 120),
    item.budget.toFixed(2),
    item.conversionRate.toFixed(2),
    item.threshold.toFixed(2),
    String(item.endsAt),
    String(item.impressions),
    item.bid.toFixed(2),
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyTicketViewSummaryViews(items: LegacyTicketViewSummary[]): LegacyTicketViewSummaryView[] {
  const views: LegacyTicketViewSummaryView[] = [];
  for (const item of items) {
    views.push(toLegacyTicketViewSummaryView(item));
  }
  return views;
}

export function sumLegacyTicketViewSummaryView(view: LegacyTicketViewSummaryView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedWeight + parsedBudget + parsedConversionRate;
}
