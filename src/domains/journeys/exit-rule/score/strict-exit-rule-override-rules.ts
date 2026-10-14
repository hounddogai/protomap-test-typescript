import { StrictExitRuleOverride } from "./strict-exit-rule-override.js";

/** A rule a strict exit rule override must pass. Check returns its problems, or none. */
export interface StrictExitRuleOverrideRule {
  check(item: StrictExitRuleOverride): string[];
}

export class StrictExitRuleOverrideRequiredCodeRule implements StrictExitRuleOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictExitRuleOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictExitRuleOverrideCodeLengthRule implements StrictExitRuleOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictExitRuleOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictExitRuleOverrideBudgetRangeRule implements StrictExitRuleOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictExitRuleOverride): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a strict exit rule override. */
export class StrictExitRuleOverrideValidator {
  rules: StrictExitRuleOverrideRule[];

  constructor(rules: StrictExitRuleOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: StrictExitRuleOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictExitRuleOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictExitRuleOverride[]): Map<string, string[]> {
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

export function defaultStrictExitRuleOverrideValidator(): StrictExitRuleOverrideValidator {
  return new StrictExitRuleOverrideValidator(
    [
      new StrictExitRuleOverrideRequiredCodeRule("strict exit rule override needs an entry"),
      new StrictExitRuleOverrideCodeLengthRule(1000),
      new StrictExitRuleOverrideBudgetRangeRule(7.2, 2858.8),
    ],
  );
}
