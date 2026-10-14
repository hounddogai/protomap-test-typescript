import * as text from "../../../../kit/text.js";

/** Where a weighted opt out plan is in its life cycle. */
export type WeightedOptOutPlanStatus = "requested" | "granted" | "revoked" | "expired";

/** A weighted opt out plan. Its code is unique within a tenant. */
export class WeightedOptOutPlan {
  code: string;
  label: string;
  segment: string;
  windowDays: number;
  amount: number;
  country: string;
  status: WeightedOptOutPlanStatus;

  constructor(
    code: string,
    label: string,
    segment: string,
    windowDays: number,
    amount: number,
    country: string,
    status: WeightedOptOutPlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.segment = segment;
    this.windowDays = windowDays;
    this.amount = amount;
    this.country = country;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedOptOutPlanStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedOptOutPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted opt out plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveLoad(): number {
    return Math.round((this.windowDays + this.amount) * 100) / 100;
  }

  copy(): WeightedOptOutPlan {
    return new WeightedOptOutPlan(
      this.code,
      this.label,
      this.segment,
      this.windowDays,
      this.amount,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a weighted opt out plan in status requested. */
export function newWeightedOptOutPlan(code: string, label: string): WeightedOptOutPlan {
  return new WeightedOptOutPlan(code, label, "", 0, 0, "", "requested");
}
