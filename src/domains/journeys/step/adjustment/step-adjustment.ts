/**
 * The step adjustment records of journeys's step work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a step adjustment is in its life cycle. */
export type StepAdjustmentStatus = "created" | "validated" | "published" | "retired";

/** One step adjustment, with what the planners need to act on it. */
export class StepAdjustment {
  code: string;
  title: string;
  country: string;
  minimum: number;
  approved: boolean;
  conversionRate: number;
  status: StepAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    country: string,
    minimum: number,
    approved: boolean,
    conversionRate: number,
    status: StepAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.minimum = minimum;
    this.approved = approved;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: StepAdjustmentStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
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

  moveTo(next: StepAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedExposure(): number {
    return Math.round((this.conversionRate - this.minimum) * 100) / 100;
  }

  copy(): StepAdjustment {
    return new StepAdjustment(
      this.code,
      this.title,
      this.country,
      this.minimum,
      this.approved,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a step adjustment in status created. */
export function newStepAdjustment(code: string, title: string): StepAdjustment {
  return new StepAdjustment(code, title, "", 0, false, 0, "created");
}
