import * as text from "../../../../kit/text.js";

/** Where a bounce metric is in its life cycle. */
export type BounceMetricStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a bounce metric and its current status. */
export class BounceMetric {
  code: string;
  title: string;
  openRate: number;
  channel: string;
  ownerId: string;
  amount: number;
  budget: number;
  revision: number;
  pinned: boolean;
  status: BounceMetricStatus;

  constructor(
    code: string,
    title: string,
    openRate: number,
    channel: string,
    ownerId: string,
    amount: number,
    budget: number,
    revision: number,
    pinned: boolean,
    status: BounceMetricStatus,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.channel = channel;
    this.ownerId = ownerId;
    this.amount = amount;
    this.budget = budget;
    this.revision = revision;
    this.pinned = pinned;
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

  canMoveTo(next: BounceMetricStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: BounceMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedExposure(): number {
    return Math.round(this.budget * this.openRate * 100) / 100;
  }

  copy(): BounceMetric {
    return new BounceMetric(
      this.code,
      this.title,
      this.openRate,
      this.channel,
      this.ownerId,
      this.amount,
      this.budget,
      this.revision,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a bounce metric in status planned. */
export function newBounceMetric(code: string, title: string): BounceMetric {
  return new BounceMetric(code, title, 0, "", "", 0, 0, 0, false, "planned");
}
