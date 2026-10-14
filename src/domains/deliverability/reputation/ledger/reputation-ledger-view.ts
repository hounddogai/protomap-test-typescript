import * as text from "../../../../kit/text.js";
import { ReputationLedger } from "./reputation-ledger.js";

/** How screens and exports show a reputation ledger. */
export class ReputationLedgerView {
  codeText: string;
  label: string;
  notes: string;
  campaignRef: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    notes: string,
    campaignRef: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.notes = notes;
    this.campaignRef = campaignRef;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toReputationLedgerView(item: ReputationLedger): ReputationLedgerView {
  return new ReputationLedgerView(
    item.code,
    item.label,
    text.truncate(item.notes, 64),
    item.campaignRef,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toReputationLedgerViews(items: ReputationLedger[]): ReputationLedgerView[] {
  const views: ReputationLedgerView[] = [];
  for (const item of items) {
    views.push(toReputationLedgerView(item));
  }
  return views;
}

export function sumReputationLedgerView(view: ReputationLedgerView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedScore;
}
