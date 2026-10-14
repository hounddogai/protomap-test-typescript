import * as text from "../../../../kit/text.js";

/** Where a subscription override is in its life cycle. */
export type SubscriptionOverrideStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A subscription override as the subscription team keeps it. */
export class SubscriptionOverride {
  code: string;
  name: string;
  rate: number;
  budget: number;
  margin: number;
  journeyId: string;
  floorValue: number;
  maximum: number;
  reviewer: string;
  batchSize: number;
  status: SubscriptionOverrideStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    budget: number,
    margin: number,
    journeyId: string,
    floorValue: number,
    maximum: number,
    reviewer: string,
    batchSize: number,
    status: SubscriptionOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.budget = budget;
    this.margin = margin;
    this.journeyId = journeyId;
    this.floorValue = floorValue;
    this.maximum = maximum;
    this.reviewer = reviewer;
    this.batchSize = batchSize;
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

  canMoveTo(next: SubscriptionOverrideStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: SubscriptionOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netLoad(): number {
    return Math.round(this.margin * this.maximum * 100) / 100;
  }

  copy(): SubscriptionOverride {
    return new SubscriptionOverride(
      this.code,
      this.name,
      this.rate,
      this.budget,
      this.margin,
      this.journeyId,
      this.floorValue,
      this.maximum,
      this.reviewer,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a subscription override in status draft. */
export function newSubscriptionOverride(code: string, name: string): SubscriptionOverride {
  return new SubscriptionOverride(code, name, 0, 0, 0, "", 0, 0, "", 0, "draft");
}
