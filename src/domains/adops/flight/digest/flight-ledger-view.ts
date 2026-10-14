import * as text from "../../../../kit/text.js";
import { FlightLedger } from "./flight-ledger.js";

/** How screens and exports show a flight ledger. */
export class FlightLedgerView {
  code: string;
  titleText: string;
  audienceId: string;
  limit: string;
  labelText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    audienceId: string,
    limit: string,
    labelText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.audienceId = audienceId;
    this.limit = limit;
    this.labelText = labelText;
    this.statusLabel = statusLabel;
  }
}

export function toFlightLedgerView(item: FlightLedger): FlightLedgerView {
  return new FlightLedgerView(
    item.code,
    item.title,
    item.audienceId,
    String(item.limit),
    text.truncate(item.label, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toFlightLedgerViews(items: FlightLedger[]): FlightLedgerView[] {
  const views: FlightLedgerView[] = [];
  for (const item of items) {
    views.push(toFlightLedgerView(item));
  }
  return views;
}

export function sumFlightLedgerView(view: FlightLedgerView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedLimit;
}
