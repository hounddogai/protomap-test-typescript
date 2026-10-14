import { RollingSuppressionThreshold } from "./rolling-suppression-threshold.js";

/** A rule a rolling suppression threshold must pass. Check returns its problems, or none. */
export interface RollingSuppressionThresholdRule {
  check(item: RollingSuppressionThreshold): string[];
}

export class RollingSuppressionThresholdActiveGuardRule implements RollingSuppressionThresholdRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RollingSuppressionThreshold): string[] {
    if (item.active && item.graceDays > this.limit) return [`grace days ${item.graceDays} exceeds ${this.limit} while active`];
    return [];
  }
}

export class RollingSuppressionThresholdGraceDaysRangeRule implements RollingSuppressionThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingSuppressionThreshold): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingSuppressionThresholdCostRangeRule implements RollingSuppressionThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingSuppressionThreshold): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingSuppressionThresholdCodePrefixRule implements RollingSuppressionThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingSuppressionThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingSuppressionThresholdAudienceIdLengthRule implements RollingSuppressionThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingSuppressionThreshold): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling suppression threshold. */
export class RollingSuppressionThresholdValidator {
  rules: RollingSuppressionThresholdRule[];

  constructor(rules: RollingSuppressionThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: RollingSuppressionThreshold): string[] {
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

  requireValid(item: RollingSuppressionThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingSuppressionThreshold[]): Map<string, string[]> {
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

export function defaultRollingSuppressionThresholdValidator(): RollingSuppressionThresholdValidator {
  return new RollingSuppressionThresholdValidator(
    [
      new RollingSuppressionThresholdActiveGuardRule(32),
      new RollingSuppressionThresholdGraceDaysRangeRule(16, 120),
      new RollingSuppressionThresholdCostRangeRule(9.8, 4457.4),
      new RollingSuppressionThresholdCodePrefixRule("ACM"),
      new RollingSuppressionThresholdAudienceIdLengthRule(86400),
    ],
  );
}
