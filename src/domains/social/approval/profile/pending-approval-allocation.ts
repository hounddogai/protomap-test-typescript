import * as text from "../../../../kit/text.js";

/** Where a pending approval allocation is in its life cycle. */
export type PendingApprovalAllocationStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A pending approval allocation. Its code is unique within a tenant. */
export class PendingApprovalAllocation {
  code: string;
  name: string;
  locale: string;
  visible: boolean;
  segment: string;
  expiresAt: number;
  score: number;
  channel: string;
  status: PendingApprovalAllocationStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    visible: boolean,
    segment: string,
    expiresAt: number,
    score: number,
    channel: string,
    status: PendingApprovalAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.visible = visible;
    this.segment = segment;
    this.expiresAt = expiresAt;
    this.score = score;
    this.channel = channel;
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

  canMoveTo(next: PendingApprovalAllocationStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
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
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PendingApprovalAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending approval allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedExposure(): number {
    return Math.round((this.expiresAt + this.score) * 100) / 100;
  }

  copy(): PendingApprovalAllocation {
    return new PendingApprovalAllocation(
      this.code,
      this.name,
      this.locale,
      this.visible,
      this.segment,
      this.expiresAt,
      this.score,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a pending approval allocation in status draft. */
export function newPendingApprovalAllocation(code: string, name: string): PendingApprovalAllocation {
  return new PendingApprovalAllocation(code, name, "", false, "", 0, 0, "", "draft");
}
