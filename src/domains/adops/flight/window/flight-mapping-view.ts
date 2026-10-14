import * as text from "../../../../kit/text.js";
import { FlightMapping } from "./flight-mapping.js";

/** How screens and exports show a flight mapping. */
export class FlightMappingView {
  code: string;
  name: string;
  externalRef: string;
  version: string;
  sequence: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    version: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.version = version;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toFlightMappingView(item: FlightMapping): FlightMappingView {
  return new FlightMappingView(
    text.truncate(item.code, 120),
    item.name,
    item.externalRef,
    String(item.version),
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toFlightMappingViews(items: FlightMapping[]): FlightMappingView[] {
  const views: FlightMappingView[] = [];
  for (const item of items) {
    views.push(toFlightMappingView(item));
  }
  return views;
}

export function sumFlightMappingView(view: FlightMappingView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedVersion + parsedSequence;
}
