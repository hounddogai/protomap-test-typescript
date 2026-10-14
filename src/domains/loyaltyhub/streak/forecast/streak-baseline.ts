import * as text from "../../../../kit/text.js";

/** Where a streak baseline is in its life cycle. */
export type StreakBaselineStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A streak baseline. Its code is unique within a tenant. */
export class StreakBaseline {
  code: string;
  name: string;
  impressions: number;
  country: string;
  budget: number;
  updatedAt: number;
  amount: number;
  region: string;
  status: StreakBaselineStatus;

  constructor(
    code: string,
    name: string,
    impressions: number,
    country: string,
    budget: number,
    updatedAt: number,
    amount: number,
    region: string,
    status: StreakBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.impressions = impressions;
    this.country = country;
    this.budget = budget;
    this.updatedAt = updatedAt;
    this.amount = amount;
    this.region = region;
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

  canMoveTo(next: StreakBaselineStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: StreakBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"streak baseline"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round(this.amount * this.updatedAt * 100) / 100;
  }

  copy(): StreakBaseline {
    return new StreakBaseline(
      this.code,
      this.name,
      this.impressions,
      this.country,
      this.budget,
      this.updatedAt,
      this.amount,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a streak baseline in status idle. */
export function newStreakBaseline(code: string, name: string): StreakBaseline {
  return new StreakBaseline(code, name, 0, "", 0, 0, 0, "", "idle");
}
