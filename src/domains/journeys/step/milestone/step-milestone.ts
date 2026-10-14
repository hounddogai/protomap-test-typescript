/**
 * The step milestone records of journeys's step work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a step milestone is in its life cycle. */
export type StepMilestoneStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a step milestone and its current status. */
export class StepMilestone {
  code: string;
  title: string;
  clicks: number;
  ceiling: number;
  sequence: number;
  country: string;
  budget: number;
  status: StepMilestoneStatus;

  constructor(
    code: string,
    title: string,
    clicks: number,
    ceiling: number,
    sequence: number,
    country: string,
    budget: number,
    status: StepMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.clicks = clicks;
    this.ceiling = ceiling;
    this.sequence = sequence;
    this.country = country;
    this.budget = budget;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: StepMilestoneStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StepMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveValue(): number {
    return Math.round((this.clicks - this.budget) * 100) / 100;
  }

  copy(): StepMilestone {
    return new StepMilestone(
      this.code,
      this.title,
      this.clicks,
      this.ceiling,
      this.sequence,
      this.country,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a step milestone in status new. */
export function newStepMilestone(code: string, title: string): StepMilestone {
  return new StepMilestone(code, title, 0, 0, 0, "", 0, "new");
}
