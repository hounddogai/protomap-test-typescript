import * as text from "../../../../kit/text.js";

/** Where a reward quota is in its life cycle. */
export type RewardQuotaStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A reward quota. Its code is unique within a tenant. */
export class RewardQuota {
  code: string;
  label: string;
  channel: string;
  sendAt: number;
  quantity: number;
  budget: number;
  country: string;
  threshold: number;
  discount: number;
  status: RewardQuotaStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    sendAt: number,
    quantity: number,
    budget: number,
    country: string,
    threshold: number,
    discount: number,
    status: RewardQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.sendAt = sendAt;
    this.quantity = quantity;
    this.budget = budget;
    this.country = country;
    this.threshold = threshold;
    this.discount = discount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: RewardQuotaStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"reward quota"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round(this.sendAt * this.threshold * 100) / 100;
  }

  copy(): RewardQuota {
    return new RewardQuota(
      this.code,
      this.label,
      this.channel,
      this.sendAt,
      this.quantity,
      this.budget,
      this.country,
      this.threshold,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a reward quota in status planned. */
export function newRewardQuota(code: string, label: string): RewardQuota {
  return new RewardQuota(code, label, "", 0, 0, 0, "", 0, 0, "planned");
}
