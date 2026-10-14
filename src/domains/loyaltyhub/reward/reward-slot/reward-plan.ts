import * as text from "../../../../kit/text.js";

/** Where a reward plan is in its life cycle. */
export type RewardPlanStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A reward plan as the reward team keeps it. */
export class RewardPlan {
  code: string;
  label: string;
  quantity: number;
  batchSize: number;
  durationMinutes: number;
  budget: number;
  discount: number;
  channel: string;
  campaignRef: string;
  status: RewardPlanStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    batchSize: number,
    durationMinutes: number,
    budget: number,
    discount: number,
    channel: string,
    campaignRef: string,
    status: RewardPlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.batchSize = batchSize;
    this.durationMinutes = durationMinutes;
    this.budget = budget;
    this.discount = discount;
    this.channel = channel;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: RewardPlanStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "closed";
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netVolume(): number {
    return Math.round(this.durationMinutes * this.discount * 100) / 100;
  }

  copy(): RewardPlan {
    return new RewardPlan(
      this.code,
      this.label,
      this.quantity,
      this.batchSize,
      this.durationMinutes,
      this.budget,
      this.discount,
      this.channel,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a reward plan in status draft. */
export function newRewardPlan(code: string, label: string): RewardPlan {
  return new RewardPlan(code, label, 0, 0, 0, 0, 0, "", "", "draft");
}
