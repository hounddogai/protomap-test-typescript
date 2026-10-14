import * as text from "../../../../kit/text.js";

/** Where a exit rule profile is in its life cycle. */
export type ExitRuleProfileStatus = "created" | "validated" | "published" | "retired";

/** The record of a exit rule profile and its current status. */
export class ExitRuleProfile {
  code: string;
  label: string;
  minimum: number;
  ratio: number;
  segment: string;
  category: string;
  status: ExitRuleProfileStatus;

  constructor(
    code: string,
    label: string,
    minimum: number,
    ratio: number,
    segment: string,
    category: string,
    status: ExitRuleProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.ratio = ratio;
    this.segment = segment;
    this.category = category;
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

  canMoveTo(next: ExitRuleProfileStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ExitRuleProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedExposure(): number {
    return Math.round((this.minimum + this.ratio) * 100) / 100;
  }

  copy(): ExitRuleProfile {
    return new ExitRuleProfile(
      this.code,
      this.label,
      this.minimum,
      this.ratio,
      this.segment,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a exit rule profile in status created. */
export function newExitRuleProfile(code: string, label: string): ExitRuleProfile {
  return new ExitRuleProfile(code, label, 0, 0, "", "", "created");
}
