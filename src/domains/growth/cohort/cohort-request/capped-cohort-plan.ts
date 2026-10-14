import * as text from "../../../../kit/text.js";

/** Where a capped cohort plan is in its life cycle. */
export type CappedCohortPlanStatus = "created" | "validated" | "published" | "retired";

/** A capped cohort plan. Its code is unique within a tenant. */
export class CappedCohortPlan {
  code: string;
  name: string;
  rate: number;
  campaignRef: string;
  country: string;
  visible: boolean;
  retries: number;
  ownerId: string;
  durationMinutes: number;
  status: CappedCohortPlanStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    campaignRef: string,
    country: string,
    visible: boolean,
    retries: number,
    ownerId: string,
    durationMinutes: number,
    status: CappedCohortPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.campaignRef = campaignRef;
    this.country = country;
    this.visible = visible;
    this.retries = retries;
    this.ownerId = ownerId;
    this.durationMinutes = durationMinutes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedCohortPlanStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: CappedCohortPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped cohort plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedTotal(): number {
    return Math.round((this.rate + this.retries) * 100) / 100;
  }

  copy(): CappedCohortPlan {
    return new CappedCohortPlan(
      this.code,
      this.name,
      this.rate,
      this.campaignRef,
      this.country,
      this.visible,
      this.retries,
      this.ownerId,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a capped cohort plan in status created. */
export function newCappedCohortPlan(code: string, name: string): CappedCohortPlan {
  return new CappedCohortPlan(code, name, 0, "", "", false, 0, "", 0, "created");
}
