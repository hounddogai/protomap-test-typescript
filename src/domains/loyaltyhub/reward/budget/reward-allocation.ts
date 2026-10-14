import * as text from "../../../../kit/text.js";

/** Where a reward allocation is in its life cycle. */
export type RewardAllocationStatus = "requested" | "granted" | "revoked" | "expired";

/** A reward allocation as the reward team keeps it. */
export class RewardAllocation {
  code: string;
  label: string;
  discount: number;
  campaignRef: string;
  quantity: number;
  reviewer: string;
  country: string;
  cohort: string;
  active: boolean;
  status: RewardAllocationStatus;

  constructor(
    code: string,
    label: string,
    discount: number,
    campaignRef: string,
    quantity: number,
    reviewer: string,
    country: string,
    cohort: string,
    active: boolean,
    status: RewardAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.discount = discount;
    this.campaignRef = campaignRef;
    this.quantity = quantity;
    this.reviewer = reviewer;
    this.country = country;
    this.cohort = cohort;
    this.active = active;
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

  canMoveTo(next: RewardAllocationStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
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

  moveTo(next: RewardAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedVolume(): number {
    return Math.round((this.discount - this.quantity) * 100) / 100;
  }

  copy(): RewardAllocation {
    return new RewardAllocation(
      this.code,
      this.label,
      this.discount,
      this.campaignRef,
      this.quantity,
      this.reviewer,
      this.country,
      this.cohort,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a reward allocation in status requested. */
export function newRewardAllocation(code: string, label: string): RewardAllocation {
  return new RewardAllocation(code, label, 0, "", 0, "", "", "", false, "requested");
}
