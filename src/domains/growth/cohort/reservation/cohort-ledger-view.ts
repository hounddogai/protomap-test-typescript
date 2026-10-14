import * as text from "../../../../kit/text.js";
import { CohortLedger } from "./cohort-ledger.js";

/** How screens and exports show a cohort ledger. */
export class CohortLedgerView {
  code: string;
  name: string;
  version: string;
  summary: string;
  sequence: string;
  graceDays: string;
  contactEmail: string;
  cost: string;
  active: string;
  timezone: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    version: string,
    summary: string,
    sequence: string,
    graceDays: string,
    contactEmail: string,
    cost: string,
    active: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.version = version;
    this.summary = summary;
    this.sequence = sequence;
    this.graceDays = graceDays;
    this.contactEmail = contactEmail;
    this.cost = cost;
    this.active = active;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toCohortLedgerView(item: CohortLedger): CohortLedgerView {
  return new CohortLedgerView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 120),
    String(item.version),
    item.summary,
    String(item.sequence),
    String(item.graceDays),
    item.contactEmail,
    item.cost.toFixed(2),
    `${item.active}`,
    item.timezone,
    `${item.status}`.toUpperCase(),
  );
}

export function toCohortLedgerViews(items: CohortLedger[]): CohortLedgerView[] {
  const views: CohortLedgerView[] = [];
  for (const item of items) {
    views.push(toCohortLedgerView(item));
  }
  return views;
}

export function sumCohortLedgerView(view: CohortLedgerView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedVersion + parsedSequence + parsedGraceDays;
}
