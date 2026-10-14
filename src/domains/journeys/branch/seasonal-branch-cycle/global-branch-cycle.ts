/**
 * The global branch cycle records of journeys's branch work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global branch cycle is in its life cycle. */
export type GlobalBranchCycleStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a global branch cycle and its current status. */
export class GlobalBranchCycle {
  code: string;
  label: string;
  utmSource: string;
  windowDays: number;
  durationMinutes: number;
  bid: number;
  weight: number;
  endsAt: number;
  status: GlobalBranchCycleStatus;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    windowDays: number,
    durationMinutes: number,
    bid: number,
    weight: number,
    endsAt: number,
    status: GlobalBranchCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.windowDays = windowDays;
    this.durationMinutes = durationMinutes;
    this.bid = bid;
    this.weight = weight;
    this.endsAt = endsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalBranchCycleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: GlobalBranchCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global branch cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedValue(): number {
    return Math.round(this.endsAt * this.weight * 100) / 100;
  }

  copy(): GlobalBranchCycle {
    return new GlobalBranchCycle(
      this.code,
      this.label,
      this.utmSource,
      this.windowDays,
      this.durationMinutes,
      this.bid,
      this.weight,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a global branch cycle in status new. */
export function newGlobalBranchCycle(code: string, label: string): GlobalBranchCycle {
  return new GlobalBranchCycle(code, label, "", 0, 0, 0, 0, 0, "new");
}
