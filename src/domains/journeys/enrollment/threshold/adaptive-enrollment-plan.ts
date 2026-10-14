import * as text from "../../../../kit/text.js";

/** Where a adaptive enrollment plan is in its life cycle. */
export type AdaptiveEnrollmentPlanStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A adaptive enrollment plan as the enrollment team keeps it. */
export class AdaptiveEnrollmentPlan {
  code: string;
  name: string;
  country: string;
  bid: number;
  journeyId: string;
  limit: number;
  status: AdaptiveEnrollmentPlanStatus;

  constructor(
    code: string,
    name: string,
    country: string,
    bid: number,
    journeyId: string,
    limit: number,
    status: AdaptiveEnrollmentPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.bid = bid;
    this.journeyId = journeyId;
    this.limit = limit;
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

  canMoveTo(next: AdaptiveEnrollmentPlanStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        return next === "in_progress" || next === "completed";
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

  moveTo(next: AdaptiveEnrollmentPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive enrollment plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedTotal(): number {
    return Math.round((this.bid - this.limit) * 100) / 100;
  }

  copy(): AdaptiveEnrollmentPlan {
    return new AdaptiveEnrollmentPlan(
      this.code,
      this.name,
      this.country,
      this.bid,
      this.journeyId,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a adaptive enrollment plan in status planned. */
export function newAdaptiveEnrollmentPlan(code: string, name: string): AdaptiveEnrollmentPlan {
  return new AdaptiveEnrollmentPlan(code, name, "", 0, "", 0, "planned");
}
