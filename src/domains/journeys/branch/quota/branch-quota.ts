/**
 * The branch quota records of journeys's branch work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a branch quota is in its life cycle. */
export type BranchQuotaStatus = "new" | "queued" | "running" | "done" | "failed";

/** A branch quota as the branch team keeps it. */
export class BranchQuota {
  code: string;
  title: string;
  segment: string;
  endsAt: number;
  notes: string;
  status: BranchQuotaStatus;

  constructor(
    code: string,
    title: string,
    segment: string,
    endsAt: number,
    notes: string,
    status: BranchQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.segment = segment;
    this.endsAt = endsAt;
    this.notes = notes;
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

  canMoveTo(next: BranchQuotaStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BranchQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.endsAt;
  }

  copy(): BranchQuota {
    return new BranchQuota(this.code, this.title, this.segment, this.endsAt, this.notes, this.status);
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a branch quota in status new. */
export function newBranchQuota(code: string, title: string): BranchQuota {
  return new BranchQuota(code, title, "", 0, "", "new");
}
