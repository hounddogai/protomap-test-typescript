import * as text from "../../../../kit/text.js";
import { PendingStreakAudit } from "./pending-streak-audit.js";

/** How screens and exports show a pending streak audit. */
export class PendingStreakAuditView {
  code: string;
  title: string;
  phone: string;
  scoreText: string;
  limitText: string;
  startsAtText: string;
  cost: string;
  journeyIdText: string;
  checksumText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    phone: string,
    scoreText: string,
    limitText: string,
    startsAtText: string,
    cost: string,
    journeyIdText: string,
    checksumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.phone = phone;
    this.scoreText = scoreText;
    this.limitText = limitText;
    this.startsAtText = startsAtText;
    this.cost = cost;
    this.journeyIdText = journeyIdText;
    this.checksumText = checksumText;
    this.statusLabel = statusLabel;
  }
}

export function toPendingStreakAuditView(item: PendingStreakAudit): PendingStreakAuditView {
  return new PendingStreakAuditView(
    item.code,
    item.title,
    text.truncate(item.phone, 120),
    item.score.toFixed(2),
    String(item.limit),
    String(item.startsAt),
    item.cost.toFixed(2),
    item.journeyId,
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingStreakAuditViews(items: PendingStreakAudit[]): PendingStreakAuditView[] {
  const views: PendingStreakAuditView[] = [];
  for (const item of items) {
    views.push(toPendingStreakAuditView(item));
  }
  return views;
}

export function sumPendingStreakAuditView(view: PendingStreakAuditView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  return parsedScore + parsedLimit + parsedStartsAt;
}
