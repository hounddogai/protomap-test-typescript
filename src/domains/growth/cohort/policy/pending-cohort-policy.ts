import * as text from "../../../../kit/text.js";

/** Where a pending cohort policy is in its life cycle. */
export type PendingCohortPolicyStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One pending cohort policy, with what the planners need to act on it. */
export class PendingCohortPolicy {
  code: string;
  label: string;
  floorValue: number;
  minimum: number;
  amount: number;
  weight: number;
  country: string;
  score: number;
  budget: number;
  status: PendingCohortPolicyStatus;

  constructor(
    code: string,
    label: string,
    floorValue: number,
    minimum: number,
    amount: number,
    weight: number,
    country: string,
    score: number,
    budget: number,
    status: PendingCohortPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.minimum = minimum;
    this.amount = amount;
    this.weight = weight;
    this.country = country;
    this.score = score;
    this.budget = budget;
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

  canMoveTo(next: PendingCohortPolicyStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingCohortPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending cohort policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedLoad(): number {
    return Math.round(this.minimum * this.amount * 100) / 100;
  }

  copy(): PendingCohortPolicy {
    return new PendingCohortPolicy(
      this.code,
      this.label,
      this.floorValue,
      this.minimum,
      this.amount,
      this.weight,
      this.country,
      this.score,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a pending cohort policy in status idle. */
export function newPendingCohortPolicy(code: string, label: string): PendingCohortPolicy {
  return new PendingCohortPolicy(code, label, 0, 0, 0, 0, "", 0, 0, "idle");
}
