import * as text from "../../../../kit/text.js";

/** Where a manual enrollment allocation is in its life cycle. */
export type ManualEnrollmentAllocationStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a manual enrollment allocation and its current status. */
export class ManualEnrollmentAllocation {
  code: string;
  name: string;
  source: string;
  score: number;
  openRate: number;
  limit: number;
  budget: number;
  locale: string;
  status: ManualEnrollmentAllocationStatus;

  constructor(
    code: string,
    name: string,
    source: string,
    score: number,
    openRate: number,
    limit: number,
    budget: number,
    locale: string,
    status: ManualEnrollmentAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.score = score;
    this.openRate = openRate;
    this.limit = limit;
    this.budget = budget;
    this.locale = locale;
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

  canMoveTo(next: ManualEnrollmentAllocationStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: ManualEnrollmentAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual enrollment allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"manual enrollment allocation"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round(this.budget * this.score * 100) / 100;
  }

  copy(): ManualEnrollmentAllocation {
    return new ManualEnrollmentAllocation(
      this.code,
      this.name,
      this.source,
      this.score,
      this.openRate,
      this.limit,
      this.budget,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a manual enrollment allocation in status idle. */
export function newManualEnrollmentAllocation(code: string, name: string): ManualEnrollmentAllocation {
  return new ManualEnrollmentAllocation(code, name, "", 0, 0, 0, 0, "", "idle");
}
