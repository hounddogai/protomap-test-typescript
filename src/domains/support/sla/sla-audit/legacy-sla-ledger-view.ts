import * as text from "../../../../kit/text.js";
import { LegacySlaLedger } from "./legacy-sla-ledger.js";

/** How screens and exports show a legacy sla ledger. */
export class LegacySlaLedgerView {
  codeText: string;
  name: string;
  ownerId: string;
  sequence: string;
  ratio: string;
  activeText: string;
  label: string;
  channel: string;
  variantText: string;
  revision: string;
  journeyIdText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    ownerId: string,
    sequence: string,
    ratio: string,
    activeText: string,
    label: string,
    channel: string,
    variantText: string,
    revision: string,
    journeyIdText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.ownerId = ownerId;
    this.sequence = sequence;
    this.ratio = ratio;
    this.activeText = activeText;
    this.label = label;
    this.channel = channel;
    this.variantText = variantText;
    this.revision = revision;
    this.journeyIdText = journeyIdText;
    this.statusLabel = statusLabel;
  }
}

export function toLegacySlaLedgerView(item: LegacySlaLedger): LegacySlaLedgerView {
  return new LegacySlaLedgerView(
    text.truncate(item.code, 80),
    item.name,
    item.ownerId,
    String(item.sequence),
    item.ratio.toFixed(2),
    `${item.active}`,
    item.label,
    text.truncate(item.channel, 80),
    text.truncate(item.variant, 64),
    String(item.revision),
    text.truncate(item.journeyId, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacySlaLedgerViews(items: LegacySlaLedger[]): LegacySlaLedgerView[] {
  const views: LegacySlaLedgerView[] = [];
  for (const item of items) {
    views.push(toLegacySlaLedgerView(item));
  }
  return views;
}

export function sumLegacySlaLedgerView(view: LegacySlaLedgerView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedSequence + parsedRatio + parsedRevision;
}
