import * as text from "../../../../kit/text.js";
import { TicketViewDraft } from "./ticket-view-draft.js";

/** How screens and exports show a ticket view draft. */
export class TicketViewDraftView {
  code: string;
  title: string;
  variant: string;
  journeyId: string;
  marginText: string;
  frequencyCap: string;
  maximum: string;
  countryText: string;
  openRate: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    variant: string,
    journeyId: string,
    marginText: string,
    frequencyCap: string,
    maximum: string,
    countryText: string,
    openRate: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.variant = variant;
    this.journeyId = journeyId;
    this.marginText = marginText;
    this.frequencyCap = frequencyCap;
    this.maximum = maximum;
    this.countryText = countryText;
    this.openRate = openRate;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toTicketViewDraftView(item: TicketViewDraft): TicketViewDraftView {
  return new TicketViewDraftView(
    item.code,
    text.truncate(item.title, 64),
    item.variant,
    item.journeyId,
    item.margin.toFixed(2),
    String(item.frequencyCap),
    item.maximum.toFixed(2),
    item.country,
    item.openRate.toFixed(2),
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toTicketViewDraftViews(items: TicketViewDraft[]): TicketViewDraftView[] {
  const views: TicketViewDraftView[] = [];
  for (const item of items) {
    views.push(toTicketViewDraftView(item));
  }
  return views;
}

export function sumTicketViewDraftView(view: TicketViewDraftView): number {
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedMargin + parsedFrequencyCap + parsedMaximum;
}
