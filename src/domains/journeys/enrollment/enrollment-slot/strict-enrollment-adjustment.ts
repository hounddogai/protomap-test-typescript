import * as text from "../../../../kit/text.js";

/** Where a strict enrollment adjustment is in its life cycle. */
export type StrictEnrollmentAdjustmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A strict enrollment adjustment as the enrollment team keeps it. */
export class StrictEnrollmentAdjustment {
  code: string;
  name: string;
  externalRef: string;
  minimum: number;
  journeyId: string;
  batchSize: number;
  description: string;
  status: StrictEnrollmentAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    minimum: number,
    journeyId: string,
    batchSize: number,
    description: string,
    status: StrictEnrollmentAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.minimum = minimum;
    this.journeyId = journeyId;
    this.batchSize = batchSize;
    this.description = description;
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

  canMoveTo(next: StrictEnrollmentAdjustmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: StrictEnrollmentAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict enrollment adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"strict enrollment adjustment"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round(this.batchSize * this.minimum * 100) / 100;
  }

  copy(): StrictEnrollmentAdjustment {
    return new StrictEnrollmentAdjustment(
      this.code,
      this.name,
      this.externalRef,
      this.minimum,
      this.journeyId,
      this.batchSize,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a strict enrollment adjustment in status proposed. */
export function newStrictEnrollmentAdjustment(code: string, name: string): StrictEnrollmentAdjustment {
  return new StrictEnrollmentAdjustment(code, name, "", 0, "", 0, "", "proposed");
}
