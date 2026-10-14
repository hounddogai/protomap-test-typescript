/**
 * The capped proof cycle records of consentcenter's proof work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped proof cycle is in its life cycle. */
export type CappedProofCycleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A capped proof cycle. Its code is unique within a tenant. */
export class CappedProofCycle {
  code: string;
  name: string;
  title: string;
  cohort: string;
  category: string;
  sendAt: number;
  priority: number;
  threshold: number;
  status: CappedProofCycleStatus;

  constructor(
    code: string,
    name: string,
    title: string,
    cohort: string,
    category: string,
    sendAt: number,
    priority: number,
    threshold: number,
    status: CappedProofCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.title = title;
    this.cohort = cohort;
    this.category = category;
    this.sendAt = sendAt;
    this.priority = priority;
    this.threshold = threshold;
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

  canMoveTo(next: CappedProofCycleStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "closed";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: CappedProofCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped proof cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"capped proof cycle"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round(this.threshold * this.sendAt * 100) / 100;
  }

  copy(): CappedProofCycle {
    return new CappedProofCycle(
      this.code,
      this.name,
      this.title,
      this.cohort,
      this.category,
      this.sendAt,
      this.priority,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a capped proof cycle in status draft. */
export function newCappedProofCycle(code: string, name: string): CappedProofCycle {
  return new CappedProofCycle(code, name, "", "", "", 0, 0, 0, "draft");
}
