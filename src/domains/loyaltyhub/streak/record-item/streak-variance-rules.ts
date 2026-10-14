import { StreakVariance } from "./streak-variance.js";

/** A rule a streak variance must pass. Check returns its problems, or none. */
export interface StreakVarianceRule {
  check(item: StreakVariance): string[];
}

export class StreakVarianceSourceLengthRule implements StreakVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakVariance): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakVarianceCodePrefixRule implements StreakVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StreakVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StreakVarianceRequiredLabelRule implements StreakVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakVariance): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a streak variance. */
export class StreakVarianceValidator {
  rules: StreakVarianceRule[];

  constructor(rules: StreakVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: StreakVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StreakVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StreakVariance[]): Map<string, string[]> {
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

export function defaultStreakVarianceValidator(): StreakVarianceValidator {
  return new StreakVarianceValidator(
    [
      new StreakVarianceSourceLengthRule(80),
      new StreakVarianceCodePrefixRule("REF"),
      new StreakVarianceRequiredLabelRule("streak variance needs a value"),
    ],
  );
}
