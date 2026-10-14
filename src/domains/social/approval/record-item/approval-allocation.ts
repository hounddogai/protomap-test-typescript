import * as text from "../../../../kit/text.js";

/** Where a approval allocation is in its life cycle. */
export type ApprovalAllocationStatus = "created" | "validated" | "published" | "retired";

/** A approval allocation. Its code is unique within a tenant. */
export class ApprovalAllocation {
  code: string;
  title: string;
  endsAt: number;
  timezone: string;
  externalRef: string;
  minimum: number;
  status: ApprovalAllocationStatus;

  constructor(
    code: string,
    title: string,
    endsAt: number,
    timezone: string,
    externalRef: string,
    minimum: number,
    status: ApprovalAllocationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.timezone = timezone;
    this.externalRef = externalRef;
    this.minimum = minimum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ApprovalAllocationStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ApprovalAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"approval allocation"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round(this.minimum * this.endsAt * 100) / 100;
  }

  copy(): ApprovalAllocation {
    return new ApprovalAllocation(
      this.code,
      this.title,
      this.endsAt,
      this.timezone,
      this.externalRef,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a approval allocation in status created. */
export function newApprovalAllocation(code: string, title: string): ApprovalAllocation {
  return new ApprovalAllocation(code, title, 0, "", "", 0, "created");
}
