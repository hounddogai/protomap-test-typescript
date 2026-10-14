/**
 * The branch exception records of journeys's branch work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a branch exception is in its life cycle. */
export type BranchExceptionStatus = "new" | "queued" | "running" | "done" | "failed";

/** A branch exception as the branch team keeps it. */
export class BranchException {
  code: string;
  name: string;
  source: string;
  budget: number;
  priority: number;
  sendAt: number;
  status: BranchExceptionStatus;

  constructor(
    code: string,
    name: string,
    source: string,
    budget: number,
    priority: number,
    sendAt: number,
    status: BranchExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.budget = budget;
    this.priority = priority;
    this.sendAt = sendAt;
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

  canMoveTo(next: BranchExceptionStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        switch (next) {
          case "done":
          case "failed":
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

  moveTo(next: BranchExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"branch exception"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round(this.priority * this.budget * 100) / 100;
  }

  copy(): BranchException {
    return new BranchException(this.code, this.name, this.source, this.budget, this.priority, this.sendAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a branch exception in status new. */
export function newBranchException(code: string, name: string): BranchException {
  return new BranchException(code, name, "", 0, 0, 0, "new");
}
