/**
 * The streak record records of loyaltyhub's streak work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a streak record is in its life cycle. */
export type StreakRecordStatus = "requested" | "granted" | "revoked" | "expired";

/** One streak record, with what the planners need to act on it. */
export class StreakRecord {
  code: string;
  label: string;
  title: string;
  sendAt: number;
  amount: number;
  expiresAt: number;
  budget: number;
  threshold: number;
  status: StreakRecordStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    sendAt: number,
    amount: number,
    expiresAt: number,
    budget: number,
    threshold: number,
    status: StreakRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.sendAt = sendAt;
    this.amount = amount;
    this.expiresAt = expiresAt;
    this.budget = budget;
    this.threshold = threshold;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: StreakRecordStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: StreakRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedVolume(): number {
    return Math.round((this.budget - this.sendAt) * 100) / 100;
  }

  copy(): StreakRecord {
    return new StreakRecord(
      this.code,
      this.label,
      this.title,
      this.sendAt,
      this.amount,
      this.expiresAt,
      this.budget,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a streak record in status requested. */
export function newStreakRecord(code: string, label: string): StreakRecord {
  return new StreakRecord(code, label, "", 0, 0, 0, 0, 0, "requested");
}
