import * as text from "../../../../kit/text.js";

/** Where a enrollment rule is in its life cycle. */
export type EnrollmentRuleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A enrollment rule. Its code is unique within a tenant. */
export class EnrollmentRule {
  code: string;
  label: string;
  unit: string;
  revision: number;
  region: string;
  status: EnrollmentRuleStatus;

  constructor(
    code: string,
    label: string,
    unit: string,
    revision: number,
    region: string,
    status: EnrollmentRuleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.revision = revision;
    this.region = region;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: EnrollmentRuleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: EnrollmentRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"enrollment rule"} ${this.code}`;
  }

  measuredValue(): number {
    return this.revision;
  }

  copy(): EnrollmentRule {
    return new EnrollmentRule(this.code, this.label, this.unit, this.revision, this.region, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a enrollment rule in status idle. */
export function newEnrollmentRule(code: string, label: string): EnrollmentRule {
  return new EnrollmentRule(code, label, "", 0, "", "idle");
}
