import * as text from "../../../../kit/text.js";
import { RegionalJourneyPlan } from "./regional-journey-plan.js";

/** How screens and exports show a regional journey plan. */
export class RegionalJourneyPlanView {
  code: string;
  label: string;
  clicksText: string;
  rate: string;
  revision: string;
  ownerIdText: string;
  channel: string;
  countryText: string;
  priority: string;
  bid: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    clicksText: string,
    rate: string,
    revision: string,
    ownerIdText: string,
    channel: string,
    countryText: string,
    priority: string,
    bid: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.clicksText = clicksText;
    this.rate = rate;
    this.revision = revision;
    this.ownerIdText = ownerIdText;
    this.channel = channel;
    this.countryText = countryText;
    this.priority = priority;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalJourneyPlanView(item: RegionalJourneyPlan): RegionalJourneyPlanView {
  return new RegionalJourneyPlanView(
    item.code,
    item.label,
    String(item.clicks),
    item.rate.toFixed(2),
    String(item.revision),
    text.truncate(item.ownerId, 40),
    item.channel,
    item.country,
    String(item.priority),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalJourneyPlanViews(items: RegionalJourneyPlan[]): RegionalJourneyPlanView[] {
  const views: RegionalJourneyPlanView[] = [];
  for (const item of items) {
    views.push(toRegionalJourneyPlanView(item));
  }
  return views;
}

export function sumRegionalJourneyPlanView(view: RegionalJourneyPlanView): number {
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedClicks + parsedRate + parsedRevision;
}
