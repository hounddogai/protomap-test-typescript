import { NudgePlan } from "./nudge-plan.js";

/** A rule a nudge plan must pass. Check returns its problems, or none. */
export interface NudgePlanRule {
  check(item: NudgePlan): string[];
}

export class NudgePlanCodeLengthRule implements NudgePlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgePlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgePlanRequiredLabelRule implements NudgePlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgePlan): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class NudgePlanAttemptsRangeRule implements NudgePlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgePlan): string[] {
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

/** Runs every rule of a nudge plan. */
export class NudgePlanValidator {
  rules: NudgePlanRule[];

  constructor(rules: NudgePlanRule[]) {
    this.rules = rules;
  }

  validate(item: NudgePlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: NudgePlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgePlan[]): Map<string, string[]> {
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

export function defaultNudgePlanValidator(): NudgePlanValidator {
  return new NudgePlanValidator(
    [
      new NudgePlanCodeLengthRule(80),
      new NudgePlanRequiredLabelRule("nudge plan needs an entry"),
      new NudgePlanAttemptsRangeRule(32, 1000),
    ],
  );
}
