import * as text from "../../../../kit/text.js";

/** Where a adaptive redemption plan is in its life cycle. */
export type AdaptiveRedemptionPlanStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A adaptive redemption plan as the redemption team keeps it. */
export class AdaptiveRedemptionPlan {
  code: string;
  title: string;
  cohort: string;
  version: number;
  threshold: number;
  ownerId: string;
  createdAt: number;
  quantity: number;
  status: AdaptiveRedemptionPlanStatus;

  constructor(
    code: string,
    title: string,
    cohort: string,
    version: number,
    threshold: number,
    ownerId: string,
    createdAt: number,
    quantity: number,
    status: AdaptiveRedemptionPlanStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.version = version;
    this.threshold = threshold;
    this.ownerId = ownerId;
    this.createdAt = createdAt;
    this.quantity = quantity;
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

  canMoveTo(next: AdaptiveRedemptionPlanStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveRedemptionPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive redemption plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveExposure(): number {
    return Math.round((this.version + this.threshold) * 100) / 100;
  }

  copy(): AdaptiveRedemptionPlan {
    return new AdaptiveRedemptionPlan(
      this.code,
      this.title,
      this.cohort,
      this.version,
      this.threshold,
      this.ownerId,
      this.createdAt,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive redemption plan in status draft. */
export function newAdaptiveRedemptionPlan(code: string, title: string): AdaptiveRedemptionPlan {
  return new AdaptiveRedemptionPlan(code, title, "", 0, 0, "", 0, 0, "draft");
}
