/**
 * The approval baseline records of social's approval work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a approval baseline is in its life cycle. */
export type ApprovalBaselineStatus = "created" | "validated" | "published" | "retired";

/** A approval baseline. Its code is unique within a tenant. */
export class ApprovalBaseline {
  code: string;
  name: string;
  openRate: number;
  budget: number;
  variant: string;
  status: ApprovalBaselineStatus;

  constructor(
    code: string,
    name: string,
    openRate: number,
    budget: number,
    variant: string,
    status: ApprovalBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.openRate = openRate;
    this.budget = budget;
    this.variant = variant;
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

  canMoveTo(next: ApprovalBaselineStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ApprovalBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"approval baseline"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.budget + this.openRate) * 100) / 100;
  }

  copy(): ApprovalBaseline {
    return new ApprovalBaseline(this.code, this.name, this.openRate, this.budget, this.variant, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a approval baseline in status created. */
export function newApprovalBaseline(code: string, name: string): ApprovalBaseline {
  return new ApprovalBaseline(code, name, 0, 0, "", "created");
}
