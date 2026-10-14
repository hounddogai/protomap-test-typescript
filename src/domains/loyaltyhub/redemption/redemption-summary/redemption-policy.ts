import * as text from "../../../../kit/text.js";

/** Where a redemption policy is in its life cycle. */
export type RedemptionPolicyStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a redemption policy and its current status. */
export class RedemptionPolicy {
  code: string;
  label: string;
  audienceId: string;
  unit: string;
  approved: boolean;
  region: string;
  quantity: number;
  status: RedemptionPolicyStatus;

  constructor(
    code: string,
    label: string,
    audienceId: string,
    unit: string,
    approved: boolean,
    region: string,
    quantity: number,
    status: RedemptionPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.audienceId = audienceId;
    this.unit = unit;
    this.approved = approved;
    this.region = region;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RedemptionPolicyStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "closed";
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RedemptionPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): RedemptionPolicy {
    return new RedemptionPolicy(
      this.code,
      this.label,
      this.audienceId,
      this.unit,
      this.approved,
      this.region,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a redemption policy in status draft. */
export function newRedemptionPolicy(code: string, label: string): RedemptionPolicy {
  return new RedemptionPolicy(code, label, "", "", false, "", 0, "draft");
}
