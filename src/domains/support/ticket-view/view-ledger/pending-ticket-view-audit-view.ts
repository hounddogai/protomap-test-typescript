import * as text from "../../../../kit/text.js";
import { PendingTicketViewAudit } from "./pending-ticket-view-audit.js";

/** How screens and exports show a pending ticket view audit. */
export class PendingTicketViewAuditView {
  code: string;
  labelText: string;
  budget: string;
  externalRefText: string;
  unitText: string;
  ratio: string;
  score: string;
  channel: string;
  audienceIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    budget: string,
    externalRefText: string,
    unitText: string,
    ratio: string,
    score: string,
    channel: string,
    audienceIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.budget = budget;
    this.externalRefText = externalRefText;
    this.unitText = unitText;
    this.ratio = ratio;
    this.score = score;
    this.channel = channel;
    this.audienceIdText = audienceIdText;
    this.statusLabel = statusLabel;
  }
}

export function toPendingTicketViewAuditView(item: PendingTicketViewAudit): PendingTicketViewAuditView {
  return new PendingTicketViewAuditView(
    text.truncate(item.code, 80),
    item.label,
    item.budget.toFixed(2),
    text.truncate(item.externalRef, 80),
    item.unit,
    item.ratio.toFixed(2),
    item.score.toFixed(2),
    text.truncate(item.channel, 40),
    text.truncate(item.audienceId, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingTicketViewAuditViews(items: PendingTicketViewAudit[]): PendingTicketViewAuditView[] {
  const views: PendingTicketViewAuditView[] = [];
  for (const item of items) {
    views.push(toPendingTicketViewAuditView(item));
  }
  return views;
}

export function sumPendingTicketViewAuditView(view: PendingTicketViewAuditView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedBudget + parsedRatio + parsedScore;
}
