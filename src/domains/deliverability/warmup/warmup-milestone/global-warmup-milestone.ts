/**
 * The global warmup milestone records of deliverability's warmup work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global warmup milestone is in its life cycle. */
export type GlobalWarmupMilestoneStatus = "created" | "validated" | "published" | "retired";

/** A global warmup milestone as the warmup team keeps it. */
export class GlobalWarmupMilestone {
  code: string;
  name: string;
  currency: string;
  sequence: number;
  windowDays: number;
  approved: boolean;
  phone: string;
  source: string;
  timezone: string;
  status: GlobalWarmupMilestoneStatus;

  constructor(
    code: string,
    name: string,
    currency: string,
    sequence: number,
    windowDays: number,
    approved: boolean,
    phone: string,
    source: string,
    timezone: string,
    status: GlobalWarmupMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.sequence = sequence;
    this.windowDays = windowDays;
    this.approved = approved;
    this.phone = phone;
    this.source = source;
    this.timezone = timezone;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalWarmupMilestoneStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalWarmupMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global warmup milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"global warmup milestone"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.sequence + this.windowDays) * 100) / 100;
  }

  copy(): GlobalWarmupMilestone {
    return new GlobalWarmupMilestone(
      this.code,
      this.name,
      this.currency,
      this.sequence,
      this.windowDays,
      this.approved,
      this.phone,
      this.source,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a global warmup milestone in status created. */
export function newGlobalWarmupMilestone(code: string, name: string): GlobalWarmupMilestone {
  return new GlobalWarmupMilestone(code, name, "", 0, 0, false, "", "", "", "created");
}
