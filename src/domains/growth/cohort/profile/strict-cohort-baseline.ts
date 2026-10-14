import * as text from "../../../../kit/text.js";

/** Where a strict cohort baseline is in its life cycle. */
export type StrictCohortBaselineStatus = "created" | "validated" | "published" | "retired";

/** The record of a strict cohort baseline and its current status. */
export class StrictCohortBaseline {
  code: string;
  label: string;
  version: number;
  bid: number;
  graceDays: number;
  tags: string[];
  variant: string;
  source: string;
  status: StrictCohortBaselineStatus;

  constructor(
    code: string,
    label: string,
    version: number,
    bid: number,
    graceDays: number,
    tags: string[],
    variant: string,
    source: string,
    status: StrictCohortBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.bid = bid;
    this.graceDays = graceDays;
    this.tags = tags;
    this.variant = variant;
    this.source = source;
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

  canMoveTo(next: StrictCohortBaselineStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictCohortBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict cohort baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveLoad(): number {
    return Math.round(this.version * this.bid * 100) / 100;
  }

  copy(): StrictCohortBaseline {
    return new StrictCohortBaseline(
      this.code,
      this.label,
      this.version,
      this.bid,
      this.graceDays,
      this.tags,
      this.variant,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a strict cohort baseline in status created. */
export function newStrictCohortBaseline(code: string, label: string): StrictCohortBaseline {
  return new StrictCohortBaseline(code, label, 0, 0, 0, [], "", "", "created");
}
