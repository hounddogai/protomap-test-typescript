import * as text from "../../../../kit/text.js";
import { FlightBundle } from "./flight-bundle.js";

/** How screens and exports show a flight bundle. */
export class FlightBundleView {
  codeText: string;
  title: string;
  startsAtText: string;
  clicksText: string;
  priorityText: string;
  currency: string;
  campaignRef: string;
  nameText: string;
  ownerId: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    startsAtText: string,
    clicksText: string,
    priorityText: string,
    currency: string,
    campaignRef: string,
    nameText: string,
    ownerId: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.startsAtText = startsAtText;
    this.clicksText = clicksText;
    this.priorityText = priorityText;
    this.currency = currency;
    this.campaignRef = campaignRef;
    this.nameText = nameText;
    this.ownerId = ownerId;
    this.statusLabel = statusLabel;
  }
}

export function toFlightBundleView(item: FlightBundle): FlightBundleView {
  return new FlightBundleView(
    item.code,
    item.title,
    String(item.startsAt),
    String(item.clicks),
    String(item.priority),
    item.currency,
    item.campaignRef,
    text.truncate(item.name, 80),
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toFlightBundleViews(items: FlightBundle[]): FlightBundleView[] {
  const views: FlightBundleView[] = [];
  for (const item of items) {
    views.push(toFlightBundleView(item));
  }
  return views;
}

export function sumFlightBundleView(view: FlightBundleView): number {
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  return parsedStartsAt + parsedClicks + parsedPriority;
}
