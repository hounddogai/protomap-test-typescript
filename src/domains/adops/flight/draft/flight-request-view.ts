import * as text from "../../../../kit/text.js";
import { FlightRequest } from "./flight-request.js";

/** How screens and exports show a flight request. */
export class FlightRequestView {
  code: string;
  name: string;
  phone: string;
  clicksText: string;
  visibleText: string;
  sequenceText: string;
  weightText: string;
  channel: string;
  cost: string;
  minimum: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    phone: string,
    clicksText: string,
    visibleText: string,
    sequenceText: string,
    weightText: string,
    channel: string,
    cost: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.clicksText = clicksText;
    this.visibleText = visibleText;
    this.sequenceText = sequenceText;
    this.weightText = weightText;
    this.channel = channel;
    this.cost = cost;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toFlightRequestView(item: FlightRequest): FlightRequestView {
  return new FlightRequestView(
    text.truncate(item.code, 64),
    text.truncate(item.name, 120),
    item.phone,
    String(item.clicks),
    `${item.visible}`,
    String(item.sequence),
    item.weight.toFixed(2),
    item.channel,
    item.cost.toFixed(2),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFlightRequestViews(items: FlightRequest[]): FlightRequestView[] {
  const views: FlightRequestView[] = [];
  for (const item of items) {
    views.push(toFlightRequestView(item));
  }
  return views;
}

export function sumFlightRequestView(view: FlightRequestView): number {
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  return parsedClicks + parsedSequence + parsedWeight;
}
