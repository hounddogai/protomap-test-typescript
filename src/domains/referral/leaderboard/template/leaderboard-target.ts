import * as text from "../../../../kit/text.js";

/** Where a leaderboard target is in its life cycle. */
export type LeaderboardTargetStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a leaderboard target and its current status. */
export class LeaderboardTarget {
  code: string;
  label: string;
  locale: string;
  quantity: number;
  version: number;
  description: string;
  attempts: number;
  graceDays: number;
  attributes: Map<string, string>;
  threshold: number;
  status: LeaderboardTargetStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    quantity: number,
    version: number,
    description: string,
    attempts: number,
    graceDays: number,
    attributes: Map<string, string>,
    threshold: number,
    status: LeaderboardTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.quantity = quantity;
    this.version = version;
    this.description = description;
    this.attempts = attempts;
    this.graceDays = graceDays;
    this.attributes = attributes;
    this.threshold = threshold;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: LeaderboardTargetStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LeaderboardTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedTotal(): number {
    return Math.round(this.version * this.graceDays * 100) / 100;
  }

  copy(): LeaderboardTarget {
    return new LeaderboardTarget(
      this.code,
      this.label,
      this.locale,
      this.quantity,
      this.version,
      this.description,
      this.attempts,
      this.graceDays,
      this.attributes,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a leaderboard target in status proposed. */
export function newLeaderboardTarget(code: string, label: string): LeaderboardTarget {
  return new LeaderboardTarget(code, label, "", 0, 0, "", 0, 0, new Map<string, string>(), 0, "proposed");
}
