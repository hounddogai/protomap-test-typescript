import { RollingWaitWindow } from "./rolling-wait-window.js";

/** A rule a rolling wait window must pass. Check returns its problems, or none. */
export interface RollingWaitWindowRule {
  check(item: RollingWaitWindow): string[];
}

export class RollingWaitWindowWindowDaysRangeRule implements RollingWaitWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingWaitWindow): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingWaitWindowImpressionsRangeRule implements RollingWaitWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingWaitWindow): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingWaitWindowCodePrefixRule implements RollingWaitWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingWaitWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingWaitWindowLabelLengthRule implements RollingWaitWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingWaitWindow): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling wait window. */
export class RollingWaitWindowValidator {
  rules: RollingWaitWindowRule[];

  constructor(rules: RollingWaitWindowRule[]) {
    this.rules = rules;
  }

  validate(item: RollingWaitWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingWaitWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingWaitWindow[]): Map<string, string[]> {
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

export function defaultRollingWaitWindowValidator(): RollingWaitWindowValidator {
  return new RollingWaitWindowValidator(
    [
      new RollingWaitWindowWindowDaysRangeRule(1000, 86400),
      new RollingWaitWindowImpressionsRangeRule(80, 120),
      new RollingWaitWindowCodePrefixRule("X"),
      new RollingWaitWindowLabelLengthRule(255),
    ],
  );
}
