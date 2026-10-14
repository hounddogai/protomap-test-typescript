/**
 * The strict step schedule records of journeys's step work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict step schedule is in its life cycle. */
export type StrictStepScheduleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A strict step schedule as the step team keeps it. */
export class StrictStepSchedule {
  code: string;
  label: string;
  minimum: number;
  limit: number;
  rate: number;
  audienceId: string;
  visible: boolean;
  batchSize: number;
  frequencyCap: number;
  status: StrictStepScheduleStatus;

  constructor(
    code: string,
    label: string,
    minimum: number,
    limit: number,
    rate: number,
    audienceId: string,
    visible: boolean,
    batchSize: number,
    frequencyCap: number,
    status: StrictStepScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.limit = limit;
    this.rate = rate;
    this.audienceId = audienceId;
    this.visible = visible;
    this.batchSize = batchSize;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: StrictStepScheduleStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "archived";
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: StrictStepScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict step schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedValue(): number {
    return Math.round((this.minimum - this.batchSize) * 100) / 100;
  }

  copy(): StrictStepSchedule {
    return new StrictStepSchedule(
      this.code,
      this.label,
      this.minimum,
      this.limit,
      this.rate,
      this.audienceId,
      this.visible,
      this.batchSize,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a strict step schedule in status open. */
export function newStrictStepSchedule(code: string, label: string): StrictStepSchedule {
  return new StrictStepSchedule(code, label, 0, 0, 0, "", false, 0, 0, "open");
}
