import * as text from "../../../../kit/text.js";
import { DefaultLevelSnapshot } from "./default-level-snapshot.js";

/** How screens and exports show a default level snapshot. */
export class DefaultLevelSnapshotView {
  codeText: string;
  titleText: string;
  amount: string;
  limitText: string;
  ownerIdText: string;
  durationMinutes: string;
  scoreText: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    amount: string,
    limitText: string,
    ownerIdText: string,
    durationMinutes: string,
    scoreText: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.amount = amount;
    this.limitText = limitText;
    this.ownerIdText = ownerIdText;
    this.durationMinutes = durationMinutes;
    this.scoreText = scoreText;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultLevelSnapshotView(item: DefaultLevelSnapshot): DefaultLevelSnapshotView {
  return new DefaultLevelSnapshotView(
    item.code,
    text.truncate(item.title, 40),
    item.amount.toFixed(2),
    String(item.limit),
    item.ownerId,
    String(item.durationMinutes),
    item.score.toFixed(2),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultLevelSnapshotViews(items: DefaultLevelSnapshot[]): DefaultLevelSnapshotView[] {
  const views: DefaultLevelSnapshotView[] = [];
  for (const item of items) {
    views.push(toDefaultLevelSnapshotView(item));
  }
  return views;
}

export function sumDefaultLevelSnapshotView(view: DefaultLevelSnapshotView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedAmount + parsedLimit + parsedDurationMinutes;
}
