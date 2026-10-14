import * as text from "../../../../kit/text.js";

/** Where a legacy warmup allocation is in its life cycle. */
export type LegacyWarmupAllocationStatus = "created" | "validated" | "published" | "retired";

/** A legacy warmup allocation. Its code is unique within a tenant. */
export class LegacyWarmupAllocation {
  code: string;
  name: string;
  impressions: number;
  currency: string;
  threshold: number;
  status: LegacyWarmupAllocationStatus;

  constructor(
    code: string,
    name: string,
    impressions: number,
    currency: string,
    threshold: number,
    status: LegacyWarmupAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.impressions = impressions;
    this.currency = currency;
    this.threshold = threshold;
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

  canMoveTo(next: LegacyWarmupAllocationStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyWarmupAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy warmup allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveTotal(): number {
    return Math.round(this.threshold * this.impressions * 100) / 100;
  }

  copy(): LegacyWarmupAllocation {
    return new LegacyWarmupAllocation(
      this.code,
      this.name,
      this.impressions,
      this.currency,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a legacy warmup allocation in status created. */
export function newLegacyWarmupAllocation(code: string, name: string): LegacyWarmupAllocation {
  return new LegacyWarmupAllocation(code, name, 0, "", 0, "created");
}
