/**
 * The strict creative allocation records of adops's creative work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict creative allocation is in its life cycle. */
export type StrictCreativeAllocationStatus = "new" | "queued" | "running" | "done" | "failed";

/** A strict creative allocation. Its code is unique within a tenant. */
export class StrictCreativeAllocation {
  code: string;
  title: string;
  attempts: number;
  campaignRef: string;
  audienceId: string;
  approved: boolean;
  journeyId: string;
  status: StrictCreativeAllocationStatus;

  constructor(
    code: string,
    title: string,
    attempts: number,
    campaignRef: string,
    audienceId: string,
    approved: boolean,
    journeyId: string,
    status: StrictCreativeAllocationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.campaignRef = campaignRef;
    this.audienceId = audienceId;
    this.approved = approved;
    this.journeyId = journeyId;
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

  canMoveTo(next: StrictCreativeAllocationStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "running";
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: StrictCreativeAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict creative allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"strict creative allocation"} ${this.code}`;
  }

  measuredValue(): number {
    return this.attempts;
  }

  copy(): StrictCreativeAllocation {
    return new StrictCreativeAllocation(
      this.code,
      this.title,
      this.attempts,
      this.campaignRef,
      this.audienceId,
      this.approved,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a strict creative allocation in status new. */
export function newStrictCreativeAllocation(code: string, title: string): StrictCreativeAllocation {
  return new StrictCreativeAllocation(code, title, 0, "", "", false, "", "new");
}
