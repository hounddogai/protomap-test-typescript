/**
 * The pending frequency cycle records of adops's frequency work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending frequency cycle is in its life cycle. */
export type PendingFrequencyCycleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A pending frequency cycle as the frequency team keeps it. */
export class PendingFrequencyCycle {
  code: string;
  title: string;
  rate: number;
  country: string;
  segment: string;
  status: PendingFrequencyCycleStatus;

  constructor(
    code: string,
    title: string,
    rate: number,
    country: string,
    segment: string,
    status: PendingFrequencyCycleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.rate = rate;
    this.country = country;
    this.segment = segment;
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

  canMoveTo(next: PendingFrequencyCycleStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "suspended";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
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

  moveTo(next: PendingFrequencyCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending frequency cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.rate;
  }

  copy(): PendingFrequencyCycle {
    return new PendingFrequencyCycle(this.code, this.title, this.rate, this.country, this.segment, this.status);
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a pending frequency cycle in status draft. */
export function newPendingFrequencyCycle(code: string, title: string): PendingFrequencyCycle {
  return new PendingFrequencyCycle(code, title, 0, "", "", "draft");
}
