import { FallbackStreakTarget } from "./fallback-streak-target.js";

/** A rule a fallback streak target must pass. Check returns its problems, or none. */
export interface FallbackStreakTargetRule {
  check(item: FallbackStreakTarget): string[];
}

export class FallbackStreakTargetWindowDaysRangeRule implements FallbackStreakTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackStreakTarget): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackStreakTargetCodePrefixRule implements FallbackStreakTargetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackStreakTarget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackStreakTargetAttemptsRangeRule implements FallbackStreakTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackStreakTarget): string[] {
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

export class FallbackStreakTargetRetriesRangeRule implements FallbackStreakTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackStreakTarget): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackStreakTargetRequiredNameRule implements FallbackStreakTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackStreakTarget): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback streak target. */
export class FallbackStreakTargetValidator {
  rules: FallbackStreakTargetRule[];

  constructor(rules: FallbackStreakTargetRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackStreakTarget): string[] {
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

  requireValid(item: FallbackStreakTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackStreakTarget[]): Map<string, string[]> {
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

export function defaultFallbackStreakTargetValidator(): FallbackStreakTargetValidator {
  return new FallbackStreakTargetValidator(
    [
      new FallbackStreakTargetWindowDaysRangeRule(255, 86400),
      new FallbackStreakTargetCodePrefixRule("Q"),
      new FallbackStreakTargetAttemptsRangeRule(80, 86400),
      new FallbackStreakTargetRetriesRangeRule(120, 86400),
      new FallbackStreakTargetRequiredNameRule("fallback streak target needs this field"),
    ],
  );
}
