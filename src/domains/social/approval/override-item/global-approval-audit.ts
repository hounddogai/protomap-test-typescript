import * as text from "../../../../kit/text.js";

/** Where a global approval audit is in its life cycle. */
export type GlobalApprovalAuditStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A global approval audit. Its code is unique within a tenant. */
export class GlobalApprovalAudit {
  code: string;
  name: string;
  updatedAt: number;
  startsAt: number;
  budget: number;
  status: GlobalApprovalAuditStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    startsAt: number,
    budget: number,
    status: GlobalApprovalAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.startsAt = startsAt;
    this.budget = budget;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalApprovalAuditStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: GlobalApprovalAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global approval audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netVolume(): number {
    return Math.round((this.budget - this.updatedAt) * 100) / 100;
  }

  copy(): GlobalApprovalAudit {
    return new GlobalApprovalAudit(this.code, this.name, this.updatedAt, this.startsAt, this.budget, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a global approval audit in status open. */
export function newGlobalApprovalAudit(code: string, name: string): GlobalApprovalAudit {
  return new GlobalApprovalAudit(code, name, 0, 0, 0, "open");
}
