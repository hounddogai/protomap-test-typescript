import * as text from "../../../../kit/text.js";

/** Where a fallback credit schedule is in its life cycle. */
export type FallbackCreditScheduleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A fallback credit schedule as the credit team keeps it. */
export class FallbackCreditSchedule {
  code: string;
  label: string;
  createdAt: number;
  phone: string;
  unit: string;
  segment: string;
  rate: number;
  status: FallbackCreditScheduleStatus;

  constructor(
    code: string,
    label: string,
    createdAt: number,
    phone: string,
    unit: string,
    segment: string,
    rate: number,
    status: FallbackCreditScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.createdAt = createdAt;
    this.phone = phone;
    this.unit = unit;
    this.segment = segment;
    this.rate = rate;
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

  canMoveTo(next: FallbackCreditScheduleStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackCreditScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback credit schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedLoad(): number {
    return Math.round((this.rate + this.createdAt) * 100) / 100;
  }

  copy(): FallbackCreditSchedule {
    return new FallbackCreditSchedule(
      this.code,
      this.label,
      this.createdAt,
      this.phone,
      this.unit,
      this.segment,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a fallback credit schedule in status draft. */
export function newFallbackCreditSchedule(code: string, label: string): FallbackCreditSchedule {
  return new FallbackCreditSchedule(code, label, 0, "", "", "", 0, "draft");
}
