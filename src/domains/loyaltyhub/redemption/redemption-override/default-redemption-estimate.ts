import * as text from "../../../../kit/text.js";

/** Where a default redemption estimate is in its life cycle. */
export type DefaultRedemptionEstimateStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One default redemption estimate, with what the planners need to act on it. */
export class DefaultRedemptionEstimate {
  code: string;
  title: string;
  floorValue: number;
  name: string;
  windowDays: number;
  amount: number;
  clicks: number;
  budget: number;
  unit: string;
  maximum: number;
  status: DefaultRedemptionEstimateStatus;

  constructor(
    code: string,
    title: string,
    floorValue: number,
    name: string,
    windowDays: number,
    amount: number,
    clicks: number,
    budget: number,
    unit: string,
    maximum: number,
    status: DefaultRedemptionEstimateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.floorValue = floorValue;
    this.name = name;
    this.windowDays = windowDays;
    this.amount = amount;
    this.clicks = clicks;
    this.budget = budget;
    this.unit = unit;
    this.maximum = maximum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultRedemptionEstimateStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: DefaultRedemptionEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default redemption estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netTotal(): number {
    return Math.round((this.budget - this.windowDays) * 100) / 100;
  }

  copy(): DefaultRedemptionEstimate {
    return new DefaultRedemptionEstimate(
      this.code,
      this.title,
      this.floorValue,
      this.name,
      this.windowDays,
      this.amount,
      this.clicks,
      this.budget,
      this.unit,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a default redemption estimate in status idle. */
export function newDefaultRedemptionEstimate(code: string, title: string): DefaultRedemptionEstimate {
  return new DefaultRedemptionEstimate(code, title, 0, "", 0, 0, 0, 0, "", 0, "idle");
}
