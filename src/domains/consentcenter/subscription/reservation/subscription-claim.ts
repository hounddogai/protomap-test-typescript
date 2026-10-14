import * as text from "../../../../kit/text.js";

/** Where a subscription claim is in its life cycle. */
export type SubscriptionClaimStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A subscription claim. Its code is unique within a tenant. */
export class SubscriptionClaim {
  code: string;
  title: string;
  priority: number;
  cost: number;
  ownerId: string;
  discount: number;
  rate: number;
  channel: string;
  quantity: number;
  source: string;
  status: SubscriptionClaimStatus;

  constructor(
    code: string,
    title: string,
    priority: number,
    cost: number,
    ownerId: string,
    discount: number,
    rate: number,
    channel: string,
    quantity: number,
    source: string,
    status: SubscriptionClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.cost = cost;
    this.ownerId = ownerId;
    this.discount = discount;
    this.rate = rate;
    this.channel = channel;
    this.quantity = quantity;
    this.source = source;
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

  canMoveTo(next: SubscriptionClaimStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: SubscriptionClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"subscription claim"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round(this.quantity * this.discount * 100) / 100;
  }

  copy(): SubscriptionClaim {
    return new SubscriptionClaim(
      this.code,
      this.title,
      this.priority,
      this.cost,
      this.ownerId,
      this.discount,
      this.rate,
      this.channel,
      this.quantity,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a subscription claim in status planned. */
export function newSubscriptionClaim(code: string, title: string): SubscriptionClaim {
  return new SubscriptionClaim(code, title, 0, 0, "", 0, 0, "", 0, "", "planned");
}
