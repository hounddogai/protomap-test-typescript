import * as text from "../../../../kit/text.js";

/** Where a deflection baseline is in its life cycle. */
export type DeflectionBaselineStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One deflection baseline, with what the planners need to act on it. */
export class DeflectionBaseline {
  code: string;
  name: string;
  currency: string;
  sequence: number;
  journeyId: string;
  status: DeflectionBaselineStatus;

  constructor(
    code: string,
    name: string,
    currency: string,
    sequence: number,
    journeyId: string,
    status: DeflectionBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.sequence = sequence;
    this.journeyId = journeyId;
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

  canMoveTo(next: DeflectionBaselineStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "archived";
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
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

  moveTo(next: DeflectionBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"deflection baseline"} ${this.code}`;
  }

  measuredValue(): number {
    return this.sequence;
  }

  copy(): DeflectionBaseline {
    return new DeflectionBaseline(this.code, this.name, this.currency, this.sequence, this.journeyId, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a deflection baseline in status open. */
export function newDeflectionBaseline(code: string, name: string): DeflectionBaseline {
  return new DeflectionBaseline(code, name, "", 0, "", "open");
}
