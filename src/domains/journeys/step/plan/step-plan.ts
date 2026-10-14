/**
 * The step plan records of journeys's step work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a step plan is in its life cycle. */
export type StepPlanStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One step plan, with what the planners need to act on it. */
export class StepPlan {
  code: string;
  label: string;
  pinned: boolean;
  region: string;
  journeyId: string;
  unit: string;
  impressions: number;
  summary: string;
  variant: string;
  status: StepPlanStatus;

  constructor(
    code: string,
    label: string,
    pinned: boolean,
    region: string,
    journeyId: string,
    unit: string,
    impressions: number,
    summary: string,
    variant: string,
    status: StepPlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.region = region;
    this.journeyId = journeyId;
    this.unit = unit;
    this.impressions = impressions;
    this.summary = summary;
    this.variant = variant;
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

  canMoveTo(next: StepPlanStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: StepPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.impressions;
  }

  copy(): StepPlan {
    return new StepPlan(
      this.code,
      this.label,
      this.pinned,
      this.region,
      this.journeyId,
      this.unit,
      this.impressions,
      this.summary,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a step plan in status open. */
export function newStepPlan(code: string, label: string): StepPlan {
  return new StepPlan(code, label, false, "", "", "", 0, "", "", "open");
}
