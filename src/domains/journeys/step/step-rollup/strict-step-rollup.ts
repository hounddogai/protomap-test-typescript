/**
 * The strict step rollup records of journeys's step work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict step rollup is in its life cycle. */
export type StrictStepRollupStatus = "created" | "validated" | "published" | "retired";

/** A strict step rollup as the step team keeps it. */
export class StrictStepRollup {
  code: string;
  title: string;
  name: string;
  version: number;
  margin: number;
  reviewer: string;
  externalRef: string;
  frequencyCap: number;
  status: StrictStepRollupStatus;

  constructor(
    code: string,
    title: string,
    name: string,
    version: number,
    margin: number,
    reviewer: string,
    externalRef: string,
    frequencyCap: number,
    status: StrictStepRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.name = name;
    this.version = version;
    this.margin = margin;
    this.reviewer = reviewer;
    this.externalRef = externalRef;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: StrictStepRollupStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictStepRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict step rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"strict step rollup"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round(this.frequencyCap * this.margin * 100) / 100;
  }

  copy(): StrictStepRollup {
    return new StrictStepRollup(
      this.code,
      this.title,
      this.name,
      this.version,
      this.margin,
      this.reviewer,
      this.externalRef,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a strict step rollup in status created. */
export function newStrictStepRollup(code: string, title: string): StrictStepRollup {
  return new StrictStepRollup(code, title, "", 0, 0, "", "", 0, "created");
}
