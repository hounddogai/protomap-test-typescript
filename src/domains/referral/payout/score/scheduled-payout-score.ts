/**
 * The scheduled payout score records of referral's payout work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled payout score is in its life cycle. */
export type ScheduledPayoutScoreStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A scheduled payout score. Its code is unique within a tenant. */
export class ScheduledPayoutScore {
  code: string;
  name: string;
  openRate: number;
  budget: number;
  sequence: number;
  externalRef: string;
  channel: string;
  utmSource: string;
  status: ScheduledPayoutScoreStatus;

  constructor(
    code: string,
    name: string,
    openRate: number,
    budget: number,
    sequence: number,
    externalRef: string,
    channel: string,
    utmSource: string,
    status: ScheduledPayoutScoreStatus,
  ) {
    this.code = code;
    this.name = name;
    this.openRate = openRate;
    this.budget = budget;
    this.sequence = sequence;
    this.externalRef = externalRef;
    this.channel = channel;
    this.utmSource = utmSource;
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

  canMoveTo(next: ScheduledPayoutScoreStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "cancelled":
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

  moveTo(next: ScheduledPayoutScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled payout score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveLoad(): number {
    return Math.round(this.sequence * this.budget * 100) / 100;
  }

  copy(): ScheduledPayoutScore {
    return new ScheduledPayoutScore(
      this.code,
      this.name,
      this.openRate,
      this.budget,
      this.sequence,
      this.externalRef,
      this.channel,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a scheduled payout score in status planned. */
export function newScheduledPayoutScore(code: string, name: string): ScheduledPayoutScore {
  return new ScheduledPayoutScore(code, name, 0, 0, 0, "", "", "", "planned");
}
