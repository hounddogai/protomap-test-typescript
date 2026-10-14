import * as text from "../../../../kit/text.js";
import { TicketViewScore } from "./ticket-view-score.js";

/** How screens and exports show a ticket view score. */
export class TicketViewScoreView {
  code: string;
  label: string;
  region: string;
  campaignRef: string;
  archived: string;
  weight: string;
  unitText: string;
  ratio: string;
  priority: string;
  rate: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    region: string,
    campaignRef: string,
    archived: string,
    weight: string,
    unitText: string,
    ratio: string,
    priority: string,
    rate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.region = region;
    this.campaignRef = campaignRef;
    this.archived = archived;
    this.weight = weight;
    this.unitText = unitText;
    this.ratio = ratio;
    this.priority = priority;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toTicketViewScoreView(item: TicketViewScore): TicketViewScoreView {
  return new TicketViewScoreView(
    text.truncate(item.code, 40),
    text.truncate(item.label, 40),
    text.truncate(item.region, 40),
    item.campaignRef,
    `${item.archived}`,
    item.weight.toFixed(2),
    item.unit,
    item.ratio.toFixed(2),
    String(item.priority),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTicketViewScoreViews(items: TicketViewScore[]): TicketViewScoreView[] {
  const views: TicketViewScoreView[] = [];
  for (const item of items) {
    views.push(toTicketViewScoreView(item));
  }
  return views;
}

export function sumTicketViewScoreView(view: TicketViewScoreView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedWeight + parsedRatio + parsedPriority;
}
