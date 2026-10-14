import * as text from "../../../../kit/text.js";

/** Where a approval audit is in its life cycle. */
export type ApprovalAuditStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One approval audit, with what the planners need to act on it. */
export class ApprovalAudit {
  code: string;
  name: string;
  ownerId: string;
  capacity: number;
  retries: number;
  createdAt: number;
  bid: number;
  checksum: string;
  sendAt: number;
  limit: number;
  durationMinutes: number;
  status: ApprovalAuditStatus;

  constructor(
    code: string,
    name: string,
    ownerId: string,
    capacity: number,
    retries: number,
    createdAt: number,
    bid: number,
    checksum: string,
    sendAt: number,
    limit: number,
    durationMinutes: number,
    status: ApprovalAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ownerId = ownerId;
    this.capacity = capacity;
    this.retries = retries;
    this.createdAt = createdAt;
    this.bid = bid;
    this.checksum = checksum;
    this.sendAt = sendAt;
    this.limit = limit;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: ApprovalAuditStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ApprovalAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveLoad(): number {
    return Math.round(this.createdAt * this.limit * 100) / 100;
  }

  copy(): ApprovalAudit {
    return new ApprovalAudit(
      this.code,
      this.name,
      this.ownerId,
      this.capacity,
      this.retries,
      this.createdAt,
      this.bid,
      this.checksum,
      this.sendAt,
      this.limit,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a approval audit in status draft. */
export function newApprovalAudit(code: string, name: string): ApprovalAudit {
  return new ApprovalAudit(code, name, "", 0, 0, 0, 0, "", 0, 0, 0, "draft");
}
