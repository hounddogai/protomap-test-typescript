import { DefaultFlightLedger } from "./default-flight-ledger.js";

/** How screens and exports show a default flight ledger. */
export class DefaultFlightLedgerView {
  code: string;
  label: string;
  threshold: string;
  contactEmailText: string;
  title: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    threshold: string,
    contactEmailText: string,
    title: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.contactEmailText = contactEmailText;
    this.title = title;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultFlightLedgerView(item: DefaultFlightLedger): DefaultFlightLedgerView {
  return new DefaultFlightLedgerView(
    item.code,
    item.label,
    item.threshold.toFixed(2),
    item.contactEmail,
    item.title,
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultFlightLedgerViews(items: DefaultFlightLedger[]): DefaultFlightLedgerView[] {
  const views: DefaultFlightLedgerView[] = [];
  for (const item of items) {
    views.push(toDefaultFlightLedgerView(item));
  }
  return views;
}

export function sumDefaultFlightLedgerView(view: DefaultFlightLedgerView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedThreshold;
}
