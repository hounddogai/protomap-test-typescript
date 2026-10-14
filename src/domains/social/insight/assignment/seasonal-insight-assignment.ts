/**
 * The seasonal insight assignment records of social's insight work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal insight assignment is in its life cycle. */
export type SeasonalInsightAssignmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** A seasonal insight assignment as the insight team keeps it. */
export class SeasonalInsightAssignment {
  code: string;
  name: string;
  journeyId: string;
  budget: number;
  source: string;
  reviewer: string;
  status: SeasonalInsightAssignmentStatus;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    budget: number,
    source: string,
    reviewer: string,
    status: SeasonalInsightAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.budget = budget;
    this.source = source;
    this.reviewer = reviewer;
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

  canMoveTo(next: SeasonalInsightAssignmentStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "failed";
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalInsightAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal insight assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): SeasonalInsightAssignment {
    return new SeasonalInsightAssignment(
      this.code,
      this.name,
      this.journeyId,
      this.budget,
      this.source,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a seasonal insight assignment in status new. */
export function newSeasonalInsightAssignment(code: string, name: string): SeasonalInsightAssignment {
  return new SeasonalInsightAssignment(code, name, "", 0, "", "", "new");
}
