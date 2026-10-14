import * as text from "../../../../kit/text.js";

/** Where a tier allocation is in its life cycle. */
export type TierAllocationStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A tier allocation. Its code is unique within a tenant. */
export class TierAllocation {
  code: string;
  name: string;
  threshold: number;
  revision: number;
  impressions: number;
  status: TierAllocationStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    revision: number,
    impressions: number,
    status: TierAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.revision = revision;
    this.impressions = impressions;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: TierAllocationStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TierAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveValue(): number {
    return Math.round((this.threshold + this.impressions) * 100) / 100;
  }

  copy(): TierAllocation {
    return new TierAllocation(this.code, this.name, this.threshold, this.revision, this.impressions, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a tier allocation in status proposed. */
export function newTierAllocation(code: string, name: string): TierAllocation {
  return new TierAllocation(code, name, 0, 0, 0, "proposed");
}
