/**
 * The rolling journey rollup records of journeys's journey work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling journey rollup is in its life cycle. */
export type RollingJourneyRollupStatus = "new" | "queued" | "running" | "done" | "failed";

/** A rolling journey rollup as the journey team keeps it. */
export class RollingJourneyRollup {
  code: string;
  label: string;
  audienceId: string;
  ratio: number;
  retries: number;
  score: number;
  budget: number;
  status: RollingJourneyRollupStatus;

  constructor(
    code: string,
    label: string,
    audienceId: string,
    ratio: number,
    retries: number,
    score: number,
    budget: number,
    status: RollingJourneyRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.audienceId = audienceId;
    this.ratio = ratio;
    this.retries = retries;
    this.score = score;
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

  canMoveTo(next: RollingJourneyRollupStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done" || next === "failed";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingJourneyRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling journey rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedVolume(): number {
    return Math.round((this.budget + this.score) * 100) / 100;
  }

  copy(): RollingJourneyRollup {
    return new RollingJourneyRollup(
      this.code,
      this.label,
      this.audienceId,
      this.ratio,
      this.retries,
      this.score,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a rolling journey rollup in status new. */
export function newRollingJourneyRollup(code: string, label: string): RollingJourneyRollup {
  return new RollingJourneyRollup(code, label, "", 0, 0, 0, 0, "new");
}
