import * as text from "../../../../kit/text.js";

/** Where a pending reward rule estimate is in its life cycle. */
export type PendingRewardRuleEstimateStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One pending reward rule estimate, with what the planners need to act on it. */
export class PendingRewardRuleEstimate {
  code: string;
  name: string;
  phone: string;
  impressions: number;
  updatedAt: number;
  weight: number;
  cost: number;
  minimum: number;
  amount: number;
  status: PendingRewardRuleEstimateStatus;

  constructor(
    code: string,
    name: string,
    phone: string,
    impressions: number,
    updatedAt: number,
    weight: number,
    cost: number,
    minimum: number,
    amount: number,
    status: PendingRewardRuleEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.impressions = impressions;
    this.updatedAt = updatedAt;
    this.weight = weight;
    this.cost = cost;
    this.minimum = minimum;
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

  canMoveTo(next: PendingRewardRuleEstimateStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
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

  moveTo(next: PendingRewardRuleEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending reward rule estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"pending reward rule estimate"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.cost + this.weight) * 100) / 100;
  }

  copy(): PendingRewardRuleEstimate {
    return new PendingRewardRuleEstimate(
      this.code,
      this.name,
      this.phone,
      this.impressions,
      this.updatedAt,
      this.weight,
      this.cost,
      this.minimum,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a pending reward rule estimate in status proposed. */
export function newPendingRewardRuleEstimate(code: string, name: string): PendingRewardRuleEstimate {
  return new PendingRewardRuleEstimate(code, name, "", 0, 0, 0, 0, 0, 0, "proposed");
}
