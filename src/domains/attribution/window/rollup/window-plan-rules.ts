import * as text from "../../../../kit/text.js";
import { WindowPlan } from "./window-plan.js";

/** A rule a window plan must pass. Check returns its problems, or none. */
export interface WindowPlanRule {
  check(item: WindowPlan): string[];
}

export class WindowPlanCodePrefixRule implements WindowPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WindowPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WindowPlanAllowedLabelRule implements WindowPlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WindowPlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is stale`];
    return [];
  }
}

export class WindowPlanAttemptsRangeRule implements WindowPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowPlan): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a window plan. */
export class WindowPlanValidator {
  rules: WindowPlanRule[];

  constructor(rules: WindowPlanRule[]) {
    this.rules = rules;
  }

  validate(item: WindowPlan): string[] {
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

  requireValid(item: WindowPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowPlan[]): Map<string, string[]> {
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

export function defaultWindowPlanValidator(): WindowPlanValidator {
  return new WindowPlanValidator(
    [
      new WindowPlanCodePrefixRule("Q"),
      new WindowPlanAllowedLabelRule([]),
      new WindowPlanAttemptsRangeRule(80, 1000),
    ],
  );
}
