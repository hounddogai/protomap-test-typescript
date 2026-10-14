import * as text from "../../../../kit/text.js";

/** Where a exit rule assignment is in its life cycle. */
export type ExitRuleAssignmentStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a exit rule assignment and its current status. */
export class ExitRuleAssignment {
  code: string;
  title: string;
  attributes: Map<string, string>;
  minimum: number;
  graceDays: number;
  floorValue: number;
  status: ExitRuleAssignmentStatus;

  constructor(
    code: string,
    title: string,
    attributes: Map<string, string>,
    minimum: number,
    graceDays: number,
    floorValue: number,
    status: ExitRuleAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attributes = attributes;
    this.minimum = minimum;
    this.graceDays = graceDays;
    this.floorValue = floorValue;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ExitRuleAssignmentStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ExitRuleAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveLoad(): number {
    return Math.round((this.floorValue + this.minimum) * 100) / 100;
  }

  copy(): ExitRuleAssignment {
    return new ExitRuleAssignment(
      this.code,
      this.title,
      this.attributes,
      this.minimum,
      this.graceDays,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a exit rule assignment in status requested. */
export function newExitRuleAssignment(code: string, title: string): ExitRuleAssignment {
  return new ExitRuleAssignment(code, title, new Map<string, string>(), 0, 0, 0, "requested");
}
