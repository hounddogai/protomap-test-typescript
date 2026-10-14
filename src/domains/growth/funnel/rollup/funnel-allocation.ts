import * as text from "../../../../kit/text.js";

/** Where a funnel allocation is in its life cycle. */
export type FunnelAllocationStatus = "requested" | "granted" | "revoked" | "expired";

/** A funnel allocation. Its code is unique within a tenant. */
export class FunnelAllocation {
  code: string;
  name: string;
  updatedAt: number;
  attempts: number;
  conversionRate: number;
  checksum: string;
  priority: number;
  status: FunnelAllocationStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    attempts: number,
    conversionRate: number,
    checksum: string,
    priority: number,
    status: FunnelAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.attempts = attempts;
    this.conversionRate = conversionRate;
    this.checksum = checksum;
    this.priority = priority;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: FunnelAllocationStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FunnelAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveVolume(): number {
    return Math.round((this.priority + this.conversionRate) * 100) / 100;
  }

  copy(): FunnelAllocation {
    return new FunnelAllocation(
      this.code,
      this.name,
      this.updatedAt,
      this.attempts,
      this.conversionRate,
      this.checksum,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a funnel allocation in status requested. */
export function newFunnelAllocation(code: string, name: string): FunnelAllocation {
  return new FunnelAllocation(code, name, 0, 0, 0, "", 0, "requested");
}
