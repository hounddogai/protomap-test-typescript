import * as text from "../../../../kit/text.js";

/** Where a exit rule group is in its life cycle. */
export type ExitRuleGroupStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a exit rule group and its current status. */
export class ExitRuleGroup {
  code: string;
  name: string;
  unit: string;
  journeyId: string;
  durationMinutes: number;
  status: ExitRuleGroupStatus;

  constructor(
    code: string,
    name: string,
    unit: string,
    journeyId: string,
    durationMinutes: number,
    status: ExitRuleGroupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.journeyId = journeyId;
    this.durationMinutes = durationMinutes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ExitRuleGroupStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ExitRuleGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"exit rule group"} ${this.code}`;
  }

  measuredValue(): number {
    return this.durationMinutes;
  }

  copy(): ExitRuleGroup {
    return new ExitRuleGroup(this.code, this.name, this.unit, this.journeyId, this.durationMinutes, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a exit rule group in status proposed. */
export function newExitRuleGroup(code: string, name: string): ExitRuleGroup {
  return new ExitRuleGroup(code, name, "", "", 0, "proposed");
}
