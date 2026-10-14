import * as text from "../../../../kit/text.js";

/** Where a legacy exit rule schedule is in its life cycle. */
export type LegacyExitRuleScheduleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A legacy exit rule schedule as the exit rule team keeps it. */
export class LegacyExitRuleSchedule {
  code: string;
  name: string;
  cost: number;
  endsAt: number;
  clicks: number;
  cohort: string;
  budget: number;
  source: string;
  status: LegacyExitRuleScheduleStatus;

  constructor(
    code: string,
    name: string,
    cost: number,
    endsAt: number,
    clicks: number,
    cohort: string,
    budget: number,
    source: string,
    status: LegacyExitRuleScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cost = cost;
    this.endsAt = endsAt;
    this.clicks = clicks;
    this.cohort = cohort;
    this.budget = budget;
    this.source = source;
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

  canMoveTo(next: LegacyExitRuleScheduleStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "reopened":
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
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: LegacyExitRuleScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy exit rule schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netLoad(): number {
    return Math.round((this.endsAt - this.cost) * 100) / 100;
  }

  copy(): LegacyExitRuleSchedule {
    return new LegacyExitRuleSchedule(
      this.code,
      this.name,
      this.cost,
      this.endsAt,
      this.clicks,
      this.cohort,
      this.budget,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a legacy exit rule schedule in status open. */
export function newLegacyExitRuleSchedule(code: string, name: string): LegacyExitRuleSchedule {
  return new LegacyExitRuleSchedule(code, name, 0, 0, 0, "", 0, "", "open");
}
