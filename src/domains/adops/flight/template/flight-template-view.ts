import * as text from "../../../../kit/text.js";
import { FlightTemplate } from "./flight-template.js";

/** How screens and exports show a flight template. */
export class FlightTemplateView {
  code: string;
  nameText: string;
  channelText: string;
  contactEmail: string;
  sequence: string;
  floorValueText: string;
  cohortText: string;
  segment: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    channelText: string,
    contactEmail: string,
    sequence: string,
    floorValueText: string,
    cohortText: string,
    segment: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.channelText = channelText;
    this.contactEmail = contactEmail;
    this.sequence = sequence;
    this.floorValueText = floorValueText;
    this.cohortText = cohortText;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toFlightTemplateView(item: FlightTemplate): FlightTemplateView {
  return new FlightTemplateView(
    item.code,
    item.name,
    item.channel,
    item.contactEmail,
    String(item.sequence),
    item.floorValue.toFixed(2),
    text.truncate(item.cohort, 64),
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toFlightTemplateViews(items: FlightTemplate[]): FlightTemplateView[] {
  const views: FlightTemplateView[] = [];
  for (const item of items) {
    views.push(toFlightTemplateView(item));
  }
  return views;
}

export function sumFlightTemplateView(view: FlightTemplateView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  return parsedSequence + parsedFloorValue;
}
