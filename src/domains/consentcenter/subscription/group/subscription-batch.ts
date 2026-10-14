import * as text from "../../../../kit/text.js";

/** Where a subscription batch is in its life cycle. */
export type SubscriptionBatchStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A subscription batch as the subscription team keeps it. */
export class SubscriptionBatch {
  code: string;
  title: string;
  journeyId: string;
  channel: string;
  region: string;
  variant: string;
  retries: number;
  frequencyCap: number;
  budget: number;
  weight: number;
  status: SubscriptionBatchStatus;

  constructor(
    code: string,
    title: string,
    journeyId: string,
    channel: string,
    region: string,
    variant: string,
    retries: number,
    frequencyCap: number,
    budget: number,
    weight: number,
    status: SubscriptionBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.journeyId = journeyId;
    this.channel = channel;
    this.region = region;
    this.variant = variant;
    this.retries = retries;
    this.frequencyCap = frequencyCap;
    this.budget = budget;
    this.weight = weight;
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

  canMoveTo(next: SubscriptionBatchStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        return next === "completed";
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SubscriptionBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netExposure(): number {
    return Math.round(this.frequencyCap * this.weight * 100) / 100;
  }

  copy(): SubscriptionBatch {
    return new SubscriptionBatch(
      this.code,
      this.title,
      this.journeyId,
      this.channel,
      this.region,
      this.variant,
      this.retries,
      this.frequencyCap,
      this.budget,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a subscription batch in status planned. */
export function newSubscriptionBatch(code: string, title: string): SubscriptionBatch {
  return new SubscriptionBatch(code, title, "", "", "", "", 0, 0, 0, 0, "planned");
}
