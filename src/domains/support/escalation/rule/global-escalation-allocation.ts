import * as text from "../../../../kit/text.js";

/** Where a global escalation allocation is in its life cycle. */
export type GlobalEscalationAllocationStatus = "created" | "validated" | "published" | "retired";

/** One global escalation allocation, with what the planners need to act on it. */
export class GlobalEscalationAllocation {
  code: string;
  label: string;
  timezone: string;
  quantity: number;
  updatedAt: number;
  bid: number;
  status: GlobalEscalationAllocationStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    quantity: number,
    updatedAt: number,
    bid: number,
    status: GlobalEscalationAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.quantity = quantity;
    this.updatedAt = updatedAt;
    this.bid = bid;
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

  canMoveTo(next: GlobalEscalationAllocationStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalEscalationAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global escalation allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"global escalation allocation"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.quantity - this.bid) * 100) / 100;
  }

  copy(): GlobalEscalationAllocation {
    return new GlobalEscalationAllocation(
      this.code,
      this.label,
      this.timezone,
      this.quantity,
      this.updatedAt,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a global escalation allocation in status created. */
export function newGlobalEscalationAllocation(code: string, label: string): GlobalEscalationAllocation {
  return new GlobalEscalationAllocation(code, label, "", 0, 0, 0, "created");
}
