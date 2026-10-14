/**
 * The step override records of journeys's step work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a step override is in its life cycle. */
export type StepOverrideStatus = "new" | "queued" | "running" | "done" | "failed";

/** A step override as the step team keeps it. */
export class StepOverride {
  code: string;
  name: string;
  notes: string;
  reviewer: string;
  durationMinutes: number;
  endsAt: number;
  description: string;
  status: StepOverrideStatus;

  constructor(
    code: string,
    name: string,
    notes: string,
    reviewer: string,
    durationMinutes: number,
    endsAt: number,
    description: string,
    status: StepOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.notes = notes;
    this.reviewer = reviewer;
    this.durationMinutes = durationMinutes;
    this.endsAt = endsAt;
    this.description = description;
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

  canMoveTo(next: StepOverrideStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: StepOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"step override"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.durationMinutes - this.endsAt) * 100) / 100;
  }

  copy(): StepOverride {
    return new StepOverride(
      this.code,
      this.name,
      this.notes,
      this.reviewer,
      this.durationMinutes,
      this.endsAt,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a step override in status new. */
export function newStepOverride(code: string, name: string): StepOverride {
  return new StepOverride(code, name, "", "", 0, 0, "", "new");
}
