import * as text from "../../../../kit/text.js";

/** Where a default subscription plan is in its life cycle. */
export type DefaultSubscriptionPlanStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A default subscription plan as the subscription team keeps it. */
export class DefaultSubscriptionPlan {
  code: string;
  label: string;
  description: string;
  campaignRef: string;
  priority: number;
  sendAt: number;
  threshold: number;
  approved: boolean;
  amount: number;
  batchSize: number;
  attempts: number;
  status: DefaultSubscriptionPlanStatus;

  constructor(
    code: string,
    label: string,
    description: string,
    campaignRef: string,
    priority: number,
    sendAt: number,
    threshold: number,
    approved: boolean,
    amount: number,
    batchSize: number,
    attempts: number,
    status: DefaultSubscriptionPlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.description = description;
    this.campaignRef = campaignRef;
    this.priority = priority;
    this.sendAt = sendAt;
    this.threshold = threshold;
    this.approved = approved;
    this.amount = amount;
    this.batchSize = batchSize;
    this.attempts = attempts;
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

  canMoveTo(next: DefaultSubscriptionPlanStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
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

  moveTo(next: DefaultSubscriptionPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default subscription plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"default subscription plan"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round(this.priority * this.attempts * 100) / 100;
  }

  copy(): DefaultSubscriptionPlan {
    return new DefaultSubscriptionPlan(
      this.code,
      this.label,
      this.description,
      this.campaignRef,
      this.priority,
      this.sendAt,
      this.threshold,
      this.approved,
      this.amount,
      this.batchSize,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a default subscription plan in status planned. */
export function newDefaultSubscriptionPlan(code: string, label: string): DefaultSubscriptionPlan {
  return new DefaultSubscriptionPlan(code, label, "", "", 0, 0, 0, false, 0, 0, 0, "planned");
}
