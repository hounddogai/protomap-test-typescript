import * as text from "../../../../kit/text.js";

/** Where a rolling exit rule baseline is in its life cycle. */
export type RollingExitRuleBaselineStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a rolling exit rule baseline and its current status. */
export class RollingExitRuleBaseline {
  code: string;
  name: string;
  version: number;
  cohort: string;
  journeyId: string;
  bid: number;
  clicks: number;
  score: number;
  budget: number;
  status: RollingExitRuleBaselineStatus;

  constructor(
    code: string,
    name: string,
    version: number,
    cohort: string,
    journeyId: string,
    bid: number,
    clicks: number,
    score: number,
    budget: number,
    status: RollingExitRuleBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.version = version;
    this.cohort = cohort;
    this.journeyId = journeyId;
    this.bid = bid;
    this.clicks = clicks;
    this.score = score;
    this.budget = budget;
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

  canMoveTo(next: RollingExitRuleBaselineStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "archived";
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingExitRuleBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling exit rule baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"rolling exit rule baseline"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.budget - this.bid) * 100) / 100;
  }

  copy(): RollingExitRuleBaseline {
    return new RollingExitRuleBaseline(
      this.code,
      this.name,
      this.version,
      this.cohort,
      this.journeyId,
      this.bid,
      this.clicks,
      this.score,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a rolling exit rule baseline in status open. */
export function newRollingExitRuleBaseline(code: string, name: string): RollingExitRuleBaseline {
  return new RollingExitRuleBaseline(code, name, 0, "", "", 0, 0, 0, 0, "open");
}
