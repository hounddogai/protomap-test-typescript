import * as text from "../../../../kit/text.js";

/** Where a badge entry is in its life cycle. */
export type BadgeEntryStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a badge entry and its current status. */
export class BadgeEntry {
  code: string;
  name: string;
  updatedAt: number;
  channel: string;
  sequence: number;
  expiresAt: number;
  amount: number;
  windowDays: number;
  cohort: string;
  status: BadgeEntryStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    channel: string,
    sequence: number,
    expiresAt: number,
    amount: number,
    windowDays: number,
    cohort: string,
    status: BadgeEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.channel = channel;
    this.sequence = sequence;
    this.expiresAt = expiresAt;
    this.amount = amount;
    this.windowDays = windowDays;
    this.cohort = cohort;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: BadgeEntryStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "closed";
      case "pending":
        return next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BadgeEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedExposure(): number {
    return Math.round((this.expiresAt + this.amount) * 100) / 100;
  }

  copy(): BadgeEntry {
    return new BadgeEntry(
      this.code,
      this.name,
      this.updatedAt,
      this.channel,
      this.sequence,
      this.expiresAt,
      this.amount,
      this.windowDays,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a badge entry in status draft. */
export function newBadgeEntry(code: string, name: string): BadgeEntry {
  return new BadgeEntry(code, name, 0, "", 0, 0, 0, 0, "", "draft");
}
