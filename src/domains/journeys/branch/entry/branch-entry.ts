/**
 * The branch entry records of journeys's branch work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a branch entry is in its life cycle. */
export type BranchEntryStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A branch entry. Its code is unique within a tenant. */
export class BranchEntry {
  code: string;
  name: string;
  conversionRate: number;
  durationMinutes: number;
  budget: number;
  cost: number;
  phone: string;
  endsAt: number;
  channel: string;
  utmSource: string;
  status: BranchEntryStatus;

  constructor(
    code: string,
    name: string,
    conversionRate: number,
    durationMinutes: number,
    budget: number,
    cost: number,
    phone: string,
    endsAt: number,
    channel: string,
    utmSource: string,
    status: BranchEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRate = conversionRate;
    this.durationMinutes = durationMinutes;
    this.budget = budget;
    this.cost = cost;
    this.phone = phone;
    this.endsAt = endsAt;
    this.channel = channel;
    this.utmSource = utmSource;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: BranchEntryStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BranchEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"branch entry"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.durationMinutes + this.endsAt) * 100) / 100;
  }

  copy(): BranchEntry {
    return new BranchEntry(
      this.code,
      this.name,
      this.conversionRate,
      this.durationMinutes,
      this.budget,
      this.cost,
      this.phone,
      this.endsAt,
      this.channel,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a branch entry in status idle. */
export function newBranchEntry(code: string, name: string): BranchEntry {
  return new BranchEntry(code, name, 0, 0, 0, 0, "", 0, "", "", "idle");
}
