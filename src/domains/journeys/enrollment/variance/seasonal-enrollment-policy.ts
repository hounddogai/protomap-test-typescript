import * as text from "../../../../kit/text.js";

/** Where a seasonal enrollment policy is in its life cycle. */
export type SeasonalEnrollmentPolicyStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A seasonal enrollment policy. Its code is unique within a tenant. */
export class SeasonalEnrollmentPolicy {
  code: string;
  label: string;
  updatedAt: number;
  discount: number;
  ceiling: number;
  bid: number;
  status: SeasonalEnrollmentPolicyStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    discount: number,
    ceiling: number,
    bid: number,
    status: SeasonalEnrollmentPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.discount = discount;
    this.ceiling = ceiling;
    this.bid = bid;
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

  canMoveTo(next: SeasonalEnrollmentPolicyStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalEnrollmentPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal enrollment policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"seasonal enrollment policy"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round(this.ceiling * this.bid * 100) / 100;
  }

  copy(): SeasonalEnrollmentPolicy {
    return new SeasonalEnrollmentPolicy(
      this.code,
      this.label,
      this.updatedAt,
      this.discount,
      this.ceiling,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a seasonal enrollment policy in status proposed. */
export function newSeasonalEnrollmentPolicy(code: string, label: string): SeasonalEnrollmentPolicy {
  return new SeasonalEnrollmentPolicy(code, label, 0, 0, 0, 0, "proposed");
}
