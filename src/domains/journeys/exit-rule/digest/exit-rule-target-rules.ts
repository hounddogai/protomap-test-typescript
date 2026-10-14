import { ExitRuleTarget } from "./exit-rule-target.js";

/** A rule a exit rule target must pass. Check returns its problems, or none. */
export interface ExitRuleTargetRule {
  check(item: ExitRuleTarget): string[];
}

export class ExitRuleTargetAttemptsRangeRule implements ExitRuleTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleTarget): string[] {
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

export class ExitRuleTargetTimezoneLengthRule implements ExitRuleTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleTarget): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleTargetDiscountRangeRule implements ExitRuleTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleTarget): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ExitRuleTargetRequiredCodeRule implements ExitRuleTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a exit rule target. */
export class ExitRuleTargetValidator {
  rules: ExitRuleTargetRule[];

  constructor(rules: ExitRuleTargetRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleTarget): string[] {
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

  requireValid(item: ExitRuleTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleTarget[]): Map<string, string[]> {
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

export function defaultExitRuleTargetValidator(): ExitRuleTargetValidator {
  return new ExitRuleTargetValidator(
    [
      new ExitRuleTargetAttemptsRangeRule(64, 1000),
      new ExitRuleTargetTimezoneLengthRule(80),
      new ExitRuleTargetDiscountRangeRule(6.9, 2689.9),
      new ExitRuleTargetRequiredCodeRule("exit rule target needs this field"),
    ],
  );
}
