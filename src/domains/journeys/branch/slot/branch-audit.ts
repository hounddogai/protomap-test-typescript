import * as text from "../../../../kit/text.js";

/** Where a branch audit is in its life cycle. */
export type BranchAuditStatus = "new" | "queued" | "running" | "done" | "failed";

/** A branch audit. Its code is unique within a tenant. */
export class BranchAudit {
  code: string;
  name: string;
  durationMinutes: number;
  openRate: number;
  windowDays: number;
  status: BranchAuditStatus;

  constructor(
    code: string,
    name: string,
    durationMinutes: number,
    openRate: number,
    windowDays: number,
    status: BranchAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.openRate = openRate;
    this.windowDays = windowDays;
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

  canMoveTo(next: BranchAuditStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        switch (next) {
          case "running":
          case "done":
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

  moveTo(next: BranchAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"branch audit"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round((this.windowDays - this.openRate) * 100) / 100;
  }

  copy(): BranchAudit {
    return new BranchAudit(this.code, this.name, this.durationMinutes, this.openRate, this.windowDays, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a branch audit in status new. */
export function newBranchAudit(code: string, name: string): BranchAudit {
  return new BranchAudit(code, name, 0, 0, 0, "new");
}
