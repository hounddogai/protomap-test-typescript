import * as text from "../../../../kit/text.js";

/** Where a regional subscription allocation is in its life cycle. */
export type RegionalSubscriptionAllocationStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a regional subscription allocation and its current status. */
export class RegionalSubscriptionAllocation {
  code: string;
  label: string;
  expiresAt: number;
  margin: number;
  active: boolean;
  rate: number;
  variant: string;
  score: number;
  status: RegionalSubscriptionAllocationStatus;

  constructor(
    code: string,
    label: string,
    expiresAt: number,
    margin: number,
    active: boolean,
    rate: number,
    variant: string,
    score: number,
    status: RegionalSubscriptionAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.expiresAt = expiresAt;
    this.margin = margin;
    this.active = active;
    this.rate = rate;
    this.variant = variant;
    this.score = score;
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

  canMoveTo(next: RegionalSubscriptionAllocationStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalSubscriptionAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional subscription allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedValue(): number {
    return Math.round((this.rate + this.score) * 100) / 100;
  }

  copy(): RegionalSubscriptionAllocation {
    return new RegionalSubscriptionAllocation(
      this.code,
      this.label,
      this.expiresAt,
      this.margin,
      this.active,
      this.rate,
      this.variant,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional subscription allocation in status proposed. */
export function newRegionalSubscriptionAllocation(code: string, label: string): RegionalSubscriptionAllocation {
  return new RegionalSubscriptionAllocation(code, label, 0, 0, false, 0, "", 0, "proposed");
}
