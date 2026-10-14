import * as text from "../../../../kit/text.js";

/** Where a double opt in plan is in its life cycle. */
export type DoubleOptInPlanStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A double opt in plan. Its code is unique within a tenant. */
export class DoubleOptInPlan {
  code: string;
  label: string;
  threshold: number;
  maximum: number;
  capacity: number;
  conversionRate: number;
  utmSource: string;
  segment: string;
  budget: number;
  updatedAt: number;
  status: DoubleOptInPlanStatus;

  constructor(
    code: string,
    label: string,
    threshold: number,
    maximum: number,
    capacity: number,
    conversionRate: number,
    utmSource: string,
    segment: string,
    budget: number,
    updatedAt: number,
    status: DoubleOptInPlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.maximum = maximum;
    this.capacity = capacity;
    this.conversionRate = conversionRate;
    this.utmSource = utmSource;
    this.segment = segment;
    this.budget = budget;
    this.updatedAt = updatedAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: DoubleOptInPlanStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: DoubleOptInPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netLoad(): number {
    return Math.round((this.updatedAt + this.threshold) * 100) / 100;
  }

  copy(): DoubleOptInPlan {
    return new DoubleOptInPlan(
      this.code,
      this.label,
      this.threshold,
      this.maximum,
      this.capacity,
      this.conversionRate,
      this.utmSource,
      this.segment,
      this.budget,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a double opt in plan in status proposed. */
export function newDoubleOptInPlan(code: string, label: string): DoubleOptInPlan {
  return new DoubleOptInPlan(code, label, 0, 0, 0, 0, "", "", 0, 0, "proposed");
}
