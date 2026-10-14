import * as text from "../../../../kit/text.js";

/** Where a pending proof audit is in its life cycle. */
export type PendingProofAuditStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A pending proof audit. Its code is unique within a tenant. */
export class PendingProofAudit {
  code: string;
  title: string;
  bid: number;
  threshold: number;
  score: number;
  endsAt: number;
  cost: number;
  capacity: number;
  timezone: string;
  approved: boolean;
  minimum: number;
  status: PendingProofAuditStatus;

  constructor(
    code: string,
    title: string,
    bid: number,
    threshold: number,
    score: number,
    endsAt: number,
    cost: number,
    capacity: number,
    timezone: string,
    approved: boolean,
    minimum: number,
    status: PendingProofAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.bid = bid;
    this.threshold = threshold;
    this.score = score;
    this.endsAt = endsAt;
    this.cost = cost;
    this.capacity = capacity;
    this.timezone = timezone;
    this.approved = approved;
    this.minimum = minimum;
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

  canMoveTo(next: PendingProofAuditStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingProofAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending proof audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"pending proof audit"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round(this.endsAt * this.minimum * 100) / 100;
  }

  copy(): PendingProofAudit {
    return new PendingProofAudit(
      this.code,
      this.title,
      this.bid,
      this.threshold,
      this.score,
      this.endsAt,
      this.cost,
      this.capacity,
      this.timezone,
      this.approved,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a pending proof audit in status draft. */
export function newPendingProofAudit(code: string, title: string): PendingProofAudit {
  return new PendingProofAudit(code, title, 0, 0, 0, 0, 0, 0, "", false, 0, "draft");
}
