import { RollingOptOutTier } from "./rolling-opt-out-tier.js";

/** A rule a rolling opt out tier must pass. Check returns its problems, or none. */
export interface RollingOptOutTierRule {
  check(item: RollingOptOutTier): string[];
}

export class RollingOptOutTierDurationMinutesRangeRule implements RollingOptOutTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingOptOutTier): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingOptOutTierRequiredCodeRule implements RollingOptOutTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingOptOutTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingOptOutTierCodeLengthRule implements RollingOptOutTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingOptOutTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling opt out tier. */
export class RollingOptOutTierValidator {
  rules: RollingOptOutTierRule[];

  constructor(rules: RollingOptOutTierRule[]) {
    this.rules = rules;
  }

  validate(item: RollingOptOutTier): string[] {
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

  requireValid(item: RollingOptOutTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingOptOutTier[]): Map<string, string[]> {
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

export function defaultRollingOptOutTierValidator(): RollingOptOutTierValidator {
  return new RollingOptOutTierValidator(
    [
      new RollingOptOutTierDurationMinutesRangeRule(120, 1000),
      new RollingOptOutTierRequiredCodeRule("rolling opt out tier needs an entry"),
      new RollingOptOutTierCodeLengthRule(120),
    ],
  );
}
