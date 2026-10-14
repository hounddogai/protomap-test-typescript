import { PendingStreakBundle } from "./pending-streak-bundle.js";

/** A rule a pending streak bundle must pass. Check returns its problems, or none. */
export interface PendingStreakBundleRule {
  check(item: PendingStreakBundle): string[];
}

export class PendingStreakBundleCapacityRangeRule implements PendingStreakBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingStreakBundle): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingStreakBundleRequiredCodeRule implements PendingStreakBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingStreakBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingStreakBundleLabelLengthRule implements PendingStreakBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingStreakBundle): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingStreakBundleCodePrefixRule implements PendingStreakBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingStreakBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a pending streak bundle. */
export class PendingStreakBundleValidator {
  rules: PendingStreakBundleRule[];

  constructor(rules: PendingStreakBundleRule[]) {
    this.rules = rules;
  }

  validate(item: PendingStreakBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingStreakBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingStreakBundle[]): Map<string, string[]> {
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

export function defaultPendingStreakBundleValidator(): PendingStreakBundleValidator {
  return new PendingStreakBundleValidator(
    [
      new PendingStreakBundleCapacityRangeRule(64, 120),
      new PendingStreakBundleRequiredCodeRule("pending streak bundle needs a value"),
      new PendingStreakBundleLabelLengthRule(255),
      new PendingStreakBundleCodePrefixRule("ACM"),
    ],
  );
}
