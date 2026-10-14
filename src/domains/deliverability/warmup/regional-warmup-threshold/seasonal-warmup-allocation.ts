import * as text from "../../../../kit/text.js";

/** Where a seasonal warmup allocation is in its life cycle. */
export type SeasonalWarmupAllocationStatus = "requested" | "granted" | "revoked" | "expired";

/** A seasonal warmup allocation. Its code is unique within a tenant. */
export class SeasonalWarmupAllocation {
  code: string;
  name: string;
  cohort: string;
  amount: number;
  expiresAt: number;
  ratio: number;
  status: SeasonalWarmupAllocationStatus;

  constructor(
    code: string,
    name: string,
    cohort: string,
    amount: number,
    expiresAt: number,
    ratio: number,
    status: SeasonalWarmupAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cohort = cohort;
    this.amount = amount;
    this.expiresAt = expiresAt;
    this.ratio = ratio;
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

  canMoveTo(next: SeasonalWarmupAllocationStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalWarmupAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal warmup allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedValue(): number {
    return Math.round((this.amount - this.expiresAt) * 100) / 100;
  }

  copy(): SeasonalWarmupAllocation {
    return new SeasonalWarmupAllocation(
      this.code,
      this.name,
      this.cohort,
      this.amount,
      this.expiresAt,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a seasonal warmup allocation in status requested. */
export function newSeasonalWarmupAllocation(code: string, name: string): SeasonalWarmupAllocation {
  return new SeasonalWarmupAllocation(code, name, "", 0, 0, 0, "requested");
}
