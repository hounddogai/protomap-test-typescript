import * as text from "../../../../kit/text.js";

/** Where a exit rule override is in its life cycle. */
export type ExitRuleOverrideStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A exit rule override as the exit rule team keeps it. */
export class ExitRuleOverride {
  code: string;
  name: string;
  budget: number;
  limit: number;
  journeyId: string;
  locale: string;
  sequence: number;
  visible: boolean;
  status: ExitRuleOverrideStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    limit: number,
    journeyId: string,
    locale: string,
    sequence: number,
    visible: boolean,
    status: ExitRuleOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.limit = limit;
    this.journeyId = journeyId;
    this.locale = locale;
    this.sequence = sequence;
    this.visible = visible;
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

  canMoveTo(next: ExitRuleOverrideStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
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

  moveTo(next: ExitRuleOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedTotal(): number {
    return Math.round((this.limit + this.budget) * 100) / 100;
  }

  copy(): ExitRuleOverride {
    return new ExitRuleOverride(
      this.code,
      this.name,
      this.budget,
      this.limit,
      this.journeyId,
      this.locale,
      this.sequence,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a exit rule override in status proposed. */
export function newExitRuleOverride(code: string, name: string): ExitRuleOverride {
  return new ExitRuleOverride(code, name, 0, 0, "", "", 0, false, "proposed");
}
