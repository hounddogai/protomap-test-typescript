/**
 * The step baseline records of journeys's step work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a step baseline is in its life cycle. */
export type StepBaselineStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A step baseline as the step team keeps it. */
export class StepBaseline {
  code: string;
  title: string;
  cohort: string;
  audienceId: string;
  ownerId: string;
  ceiling: number;
  approved: boolean;
  currency: string;
  unit: string;
  windowDays: number;
  status: StepBaselineStatus;

  constructor(
    code: string,
    title: string,
    cohort: string,
    audienceId: string,
    ownerId: string,
    ceiling: number,
    approved: boolean,
    currency: string,
    unit: string,
    windowDays: number,
    status: StepBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.audienceId = audienceId;
    this.ownerId = ownerId;
    this.ceiling = ceiling;
    this.approved = approved;
    this.currency = currency;
    this.unit = unit;
    this.windowDays = windowDays;
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

  canMoveTo(next: StepBaselineStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: StepBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveValue(): number {
    return Math.round(this.ceiling * this.windowDays * 100) / 100;
  }

  copy(): StepBaseline {
    return new StepBaseline(
      this.code,
      this.title,
      this.cohort,
      this.audienceId,
      this.ownerId,
      this.ceiling,
      this.approved,
      this.currency,
      this.unit,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a step baseline in status proposed. */
export function newStepBaseline(code: string, title: string): StepBaseline {
  return new StepBaseline(code, title, "", "", "", 0, false, "", "", 0, "proposed");
}
