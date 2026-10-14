import * as text from "../../../../kit/text.js";
import { LegacyEscalationLedger } from "./legacy-escalation-ledger.js";

/** How screens and exports show a legacy escalation ledger. */
export class LegacyEscalationLedgerView {
  codeText: string;
  labelText: string;
  score: string;
  source: string;
  ratioText: string;
  versionText: string;
  durationMinutes: string;
  discountText: string;
  active: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    score: string,
    source: string,
    ratioText: string,
    versionText: string,
    durationMinutes: string,
    discountText: string,
    active: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.score = score;
    this.source = source;
    this.ratioText = ratioText;
    this.versionText = versionText;
    this.durationMinutes = durationMinutes;
    this.discountText = discountText;
    this.active = active;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyEscalationLedgerView(item: LegacyEscalationLedger): LegacyEscalationLedgerView {
  return new LegacyEscalationLedgerView(
    item.code,
    item.label,
    item.score.toFixed(2),
    text.truncate(item.source, 64),
    item.ratio.toFixed(2),
    String(item.version),
    String(item.durationMinutes),
    item.discount.toFixed(2),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyEscalationLedgerViews(items: LegacyEscalationLedger[]): LegacyEscalationLedgerView[] {
  const views: LegacyEscalationLedgerView[] = [];
  for (const item of items) {
    views.push(toLegacyEscalationLedgerView(item));
  }
  return views;
}

export function sumLegacyEscalationLedgerView(view: LegacyEscalationLedgerView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  return parsedScore + parsedRatio + parsedVersion;
}
