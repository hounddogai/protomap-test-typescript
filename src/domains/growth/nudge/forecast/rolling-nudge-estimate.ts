import * as text from "../../../../kit/text.js";

/** Where a rolling nudge estimate is in its life cycle. */
export type RollingNudgeEstimateStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a rolling nudge estimate and its current status. */
export class RollingNudgeEstimate {
  code: string;
  label: string;
  amount: number;
  floorValue: number;
  phone: string;
  rate: number;
  openRate: number;
  weight: number;
  status: RollingNudgeEstimateStatus;

  constructor(
    code: string,
    label: string,
    amount: number,
    floorValue: number,
    phone: string,
    rate: number,
    openRate: number,
    weight: number,
    status: RollingNudgeEstimateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.floorValue = floorValue;
    this.phone = phone;
    this.rate = rate;
    this.openRate = openRate;
    this.weight = weight;
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

  canMoveTo(next: RollingNudgeEstimateStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "completed";
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: RollingNudgeEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling nudge estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"rolling nudge estimate"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.rate - this.openRate) * 100) / 100;
  }

  copy(): RollingNudgeEstimate {
    return new RollingNudgeEstimate(
      this.code,
      this.label,
      this.amount,
      this.floorValue,
      this.phone,
      this.rate,
      this.openRate,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a rolling nudge estimate in status planned. */
export function newRollingNudgeEstimate(code: string, label: string): RollingNudgeEstimate {
  return new RollingNudgeEstimate(code, label, 0, 0, "", 0, 0, 0, "planned");
}
