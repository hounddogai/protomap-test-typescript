import * as text from "../../../../kit/text.js";
import { FunnelAssignment } from "./funnel-assignment.js";

/** A rule a funnel assignment must pass. Check returns its problems, or none. */
export interface FunnelAssignmentRule {
  check(item: FunnelAssignment): string[];
}

export class FunnelAssignmentFloorValueRangeRule implements FunnelAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelAssignment): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FunnelAssignmentRequiredCurrencyRule implements FunnelAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelAssignment): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class FunnelAssignmentAllowedCurrencyRule implements FunnelAssignmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FunnelAssignment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.currency))) return [`currency ${item.currency} is stale`];
    return [];
  }
}

/** Runs every rule of a funnel assignment. */
export class FunnelAssignmentValidator {
  rules: FunnelAssignmentRule[];

  constructor(rules: FunnelAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FunnelAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelAssignment[]): Map<string, string[]> {
    const report = new Map<string, string[]>();
    for (const item of items) {
      const problems = this.validate(item);
      if (problems.length > 0) {
        report.set(item.code, problems);
      }
    }
    return report;
  }
}

export function defaultFunnelAssignmentValidator(): FunnelAssignmentValidator {
  return new FunnelAssignmentValidator(
    [
      new FunnelAssignmentFloorValueRangeRule(0.5, 1815.1),
      new FunnelAssignmentRequiredCurrencyRule("funnel assignment needs this field"),
      new FunnelAssignmentAllowedCurrencyRule(["global", "primary", "tiered"]),
    ],
  );
}
