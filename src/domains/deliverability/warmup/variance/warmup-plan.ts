import * as text from "../../../../kit/text.js";

/** Where a warmup plan is in its life cycle. */
export type WarmupPlanStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One warmup plan, with what the planners need to act on it. */
export class WarmupPlan {
  code: string;
  name: string;
  cohort: string;
  threshold: number;
  retries: number;
  pinned: boolean;
  country: string;
  amount: number;
  channel: string;
  active: boolean;
  minimum: number;
  status: WarmupPlanStatus;

  constructor(
    code: string,
    name: string,
    cohort: string,
    threshold: number,
    retries: number,
    pinned: boolean,
    country: string,
    amount: number,
    channel: string,
    active: boolean,
    minimum: number,
    status: WarmupPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cohort = cohort;
    this.threshold = threshold;
    this.retries = retries;
    this.pinned = pinned;
    this.country = country;
    this.amount = amount;
    this.channel = channel;
    this.active = active;
    this.minimum = minimum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: WarmupPlanStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WarmupPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveExposure(): number {
    return Math.round(this.minimum * this.amount * 100) / 100;
  }

  copy(): WarmupPlan {
    return new WarmupPlan(
      this.code,
      this.name,
      this.cohort,
      this.threshold,
      this.retries,
      this.pinned,
      this.country,
      this.amount,
      this.channel,
      this.active,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a warmup plan in status open. */
export function newWarmupPlan(code: string, name: string): WarmupPlan {
  return new WarmupPlan(code, name, "", 0, 0, false, "", 0, "", false, 0, "open");
}
