import * as text from "../../../../kit/text.js";

/** Where a lenient flight plan is in its life cycle. */
export type LenientFlightPlanStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A lenient flight plan. Its code is unique within a tenant. */
export class LenientFlightPlan {
  code: string;
  name: string;
  batchSize: number;
  startsAt: number;
  phone: string;
  status: LenientFlightPlanStatus;

  constructor(
    code: string,
    name: string,
    batchSize: number,
    startsAt: number,
    phone: string,
    status: LenientFlightPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.batchSize = batchSize;
    this.startsAt = startsAt;
    this.phone = phone;
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

  canMoveTo(next: LenientFlightPlanStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
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

  moveTo(next: LenientFlightPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient flight plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveVolume(): number {
    return Math.round((this.batchSize + this.startsAt) * 100) / 100;
  }

  copy(): LenientFlightPlan {
    return new LenientFlightPlan(this.code, this.name, this.batchSize, this.startsAt, this.phone, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient flight plan in status open. */
export function newLenientFlightPlan(code: string, name: string): LenientFlightPlan {
  return new LenientFlightPlan(code, name, 0, 0, "", "open");
}
