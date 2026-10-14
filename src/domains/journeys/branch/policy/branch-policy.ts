/**
 * The branch policy records of journeys's branch work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a branch policy is in its life cycle. */
export type BranchPolicyStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A branch policy. Its code is unique within a tenant. */
export class BranchPolicy {
  code: string;
  name: string;
  approved: boolean;
  capacity: number;
  frequencyCap: number;
  minimum: number;
  reviewer: string;
  openRate: number;
  quantity: number;
  amount: number;
  status: BranchPolicyStatus;

  constructor(
    code: string,
    name: string,
    approved: boolean,
    capacity: number,
    frequencyCap: number,
    minimum: number,
    reviewer: string,
    openRate: number,
    quantity: number,
    amount: number,
    status: BranchPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.approved = approved;
    this.capacity = capacity;
    this.frequencyCap = frequencyCap;
    this.minimum = minimum;
    this.reviewer = reviewer;
    this.openRate = openRate;
    this.quantity = quantity;
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

  canMoveTo(next: BranchPolicyStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: BranchPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netLoad(): number {
    return Math.round((this.openRate - this.quantity) * 100) / 100;
  }

  copy(): BranchPolicy {
    return new BranchPolicy(
      this.code,
      this.name,
      this.approved,
      this.capacity,
      this.frequencyCap,
      this.minimum,
      this.reviewer,
      this.openRate,
      this.quantity,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a branch policy in status proposed. */
export function newBranchPolicy(code: string, name: string): BranchPolicy {
  return new BranchPolicy(code, name, false, 0, 0, 0, "", 0, 0, 0, "proposed");
}
