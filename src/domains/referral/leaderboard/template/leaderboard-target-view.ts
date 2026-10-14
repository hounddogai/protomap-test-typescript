import * as text from "../../../../kit/text.js";
import { LeaderboardTarget } from "./leaderboard-target.js";

/** How screens and exports show a leaderboard target. */
export class LeaderboardTargetView {
  code: string;
  label: string;
  locale: string;
  quantity: string;
  version: string;
  description: string;
  attempts: string;
  graceDays: string;
  threshold: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    locale: string,
    quantity: string,
    version: string,
    description: string,
    attempts: string,
    graceDays: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.quantity = quantity;
    this.version = version;
    this.description = description;
    this.attempts = attempts;
    this.graceDays = graceDays;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toLeaderboardTargetView(item: LeaderboardTarget): LeaderboardTargetView {
  return new LeaderboardTargetView(
    item.code,
    item.label,
    text.truncate(item.locale, 40),
    String(item.quantity),
    String(item.version),
    item.description,
    String(item.attempts),
    String(item.graceDays),
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLeaderboardTargetViews(items: LeaderboardTarget[]): LeaderboardTargetView[] {
  const views: LeaderboardTargetView[] = [];
  for (const item of items) {
    views.push(toLeaderboardTargetView(item));
  }
  return views;
}

export function sumLeaderboardTargetView(view: LeaderboardTargetView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedQuantity + parsedVersion + parsedAttempts;
}
