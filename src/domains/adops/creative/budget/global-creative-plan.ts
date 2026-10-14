import * as text from "../../../../kit/text.js";

/** Where a global creative plan is in its life cycle. */
export type GlobalCreativePlanStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A global creative plan as the creative team keeps it. */
export class GlobalCreativePlan {
  code: string;
  label: string;
  checksum: string;
  attempts: number;
  reviewer: string;
  country: string;
  approved: boolean;
  segment: string;
  unit: string;
  budget: number;
  amount: number;
  status: GlobalCreativePlanStatus;

  constructor(
    code: string,
    label: string,
    checksum: string,
    attempts: number,
    reviewer: string,
    country: string,
    approved: boolean,
    segment: string,
    unit: string,
    budget: number,
    amount: number,
    status: GlobalCreativePlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.checksum = checksum;
    this.attempts = attempts;
    this.reviewer = reviewer;
    this.country = country;
    this.approved = approved;
    this.segment = segment;
    this.unit = unit;
    this.budget = budget;
    this.amount = amount;
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

  canMoveTo(next: GlobalCreativePlanStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: GlobalCreativePlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global creative plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"global creative plan"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round(this.budget * this.amount * 100) / 100;
  }

  copy(): GlobalCreativePlan {
    return new GlobalCreativePlan(
      this.code,
      this.label,
      this.checksum,
      this.attempts,
      this.reviewer,
      this.country,
      this.approved,
      this.segment,
      this.unit,
      this.budget,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a global creative plan in status proposed. */
export function newGlobalCreativePlan(code: string, label: string): GlobalCreativePlan {
  return new GlobalCreativePlan(code, label, "", 0, "", "", false, "", "", 0, 0, "proposed");
}
