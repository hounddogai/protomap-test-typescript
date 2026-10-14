import * as text from "../../../../kit/text.js";

/** Where a global approval record is in its life cycle. */
export type GlobalApprovalRecordStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a global approval record and its current status. */
export class GlobalApprovalRecord {
  code: string;
  name: string;
  reviewer: string;
  version: number;
  bid: number;
  status: GlobalApprovalRecordStatus;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    version: number,
    bid: number,
    status: GlobalApprovalRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.version = version;
    this.bid = bid;
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

  canMoveTo(next: GlobalApprovalRecordStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        return next === "active";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: GlobalApprovalRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global approval record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveTotal(): number {
    return Math.round((this.version - this.bid) * 100) / 100;
  }

  copy(): GlobalApprovalRecord {
    return new GlobalApprovalRecord(this.code, this.name, this.reviewer, this.version, this.bid, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a global approval record in status draft. */
export function newGlobalApprovalRecord(code: string, name: string): GlobalApprovalRecord {
  return new GlobalApprovalRecord(code, name, "", 0, 0, "draft");
}
