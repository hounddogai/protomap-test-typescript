import * as text from "../../../../kit/text.js";
import { WaitPlan } from "./wait-plan.js";

/** A rule a wait plan must pass. Check returns its problems, or none. */
export interface WaitPlanRule {
  check(item: WaitPlan): string[];
}

export class WaitPlanAllowedTitleRule implements WaitPlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WaitPlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is too long`];
    return [];
  }
}

export class WaitPlanRequiredTitleRule implements WaitPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitPlan): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WaitPlanFloorValueRangeRule implements WaitPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitPlan): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WaitPlanApprovedGuardRule implements WaitPlanRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: WaitPlan): string[] {
    if (item.approved && item.floorValue > this.limit) return [`floor value ${item.floorValue} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class WaitPlanCodeLengthRule implements WaitPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a wait plan. */
export class WaitPlanValidator {
  rules: WaitPlanRule[];

  constructor(rules: WaitPlanRule[]) {
    this.rules = rules;
  }

  validate(item: WaitPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      const found = rule.check(item);
      if (found.length === 0) continue;
      for (const problem of found) {
        problems.push(`${item.code}: ${problem}`);
      }
    }
    return problems;
  }

  requireValid(item: WaitPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitPlan[]): Map<string, string[]> {
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

export function defaultWaitPlanValidator(): WaitPlanValidator {
  return new WaitPlanValidator(
    [
      new WaitPlanAllowedTitleRule([]),
      new WaitPlanRequiredTitleRule("wait plan needs a value"),
      new WaitPlanFloorValueRangeRule(8, 2777.5),
      new WaitPlanApprovedGuardRule(4.9),
      new WaitPlanCodeLengthRule(1000),
    ],
  );
}
