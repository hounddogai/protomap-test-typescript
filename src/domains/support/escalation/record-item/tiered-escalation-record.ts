/**
 * The tiered escalation record records of support's escalation work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered escalation record is in its life cycle. */
export type TieredEscalationRecordStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A tiered escalation record as the escalation team keeps it. */
export class TieredEscalationRecord {
  code: string;
  name: string;
  ceiling: number;
  limit: number;
  margin: number;
  attempts: number;
  phone: string;
  clicks: number;
  channel: string;
  amount: number;
  windowDays: number;
  status: TieredEscalationRecordStatus;

  constructor(
    code: string,
    name: string,
    ceiling: number,
    limit: number,
    margin: number,
    attempts: number,
    phone: string,
    clicks: number,
    channel: string,
    amount: number,
    windowDays: number,
    status: TieredEscalationRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ceiling = ceiling;
    this.limit = limit;
    this.margin = margin;
    this.attempts = attempts;
    this.phone = phone;
    this.clicks = clicks;
    this.channel = channel;
    this.amount = amount;
    this.windowDays = windowDays;
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

  canMoveTo(next: TieredEscalationRecordStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredEscalationRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered escalation record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveValue(): number {
    return Math.round(this.windowDays * this.attempts * 100) / 100;
  }

  copy(): TieredEscalationRecord {
    return new TieredEscalationRecord(
      this.code,
      this.name,
      this.ceiling,
      this.limit,
      this.margin,
      this.attempts,
      this.phone,
      this.clicks,
      this.channel,
      this.amount,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered escalation record in status planned. */
export function newTieredEscalationRecord(code: string, name: string): TieredEscalationRecord {
  return new TieredEscalationRecord(code, name, 0, 0, 0, 0, "", 0, "", 0, 0, "planned");
}
