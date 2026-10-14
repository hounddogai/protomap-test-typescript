/**
 * The pending reward entry records of loyaltyhub's reward work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending reward entry is in its life cycle. */
export type PendingRewardEntryStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a pending reward entry and its current status. */
export class PendingRewardEntry {
  code: string;
  name: string;
  durationMinutes: number;
  sendAt: number;
  source: string;
  currency: string;
  frequencyCap: number;
  status: PendingRewardEntryStatus;

  constructor(
    code: string,
    name: string,
    durationMinutes: number,
    sendAt: number,
    source: string,
    currency: string,
    frequencyCap: number,
    status: PendingRewardEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.sendAt = sendAt;
    this.source = source;
    this.currency = currency;
    this.frequencyCap = frequencyCap;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingRewardEntryStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingRewardEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending reward entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveVolume(): number {
    return Math.round((this.sendAt + this.frequencyCap) * 100) / 100;
  }

  copy(): PendingRewardEntry {
    return new PendingRewardEntry(
      this.code,
      this.name,
      this.durationMinutes,
      this.sendAt,
      this.source,
      this.currency,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a pending reward entry in status planned. */
export function newPendingRewardEntry(code: string, name: string): PendingRewardEntry {
  return new PendingRewardEntry(code, name, 0, 0, "", "", 0, "planned");
}
