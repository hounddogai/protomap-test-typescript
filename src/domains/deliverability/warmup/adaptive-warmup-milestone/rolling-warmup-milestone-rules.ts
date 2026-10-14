import { RollingWarmupMilestone } from "./rolling-warmup-milestone.js";

/** A rule a rolling warmup milestone must pass. Check returns its problems, or none. */
export interface RollingWarmupMilestoneRule {
  check(item: RollingWarmupMilestone): string[];
}

export class RollingWarmupMilestoneCodePrefixRule implements RollingWarmupMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingWarmupMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingWarmupMilestoneLabelLengthRule implements RollingWarmupMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingWarmupMilestone): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingWarmupMilestoneRequiredSummaryRule implements RollingWarmupMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingWarmupMilestone): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class RollingWarmupMilestoneFrequencyCapRangeRule implements RollingWarmupMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingWarmupMilestone): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingWarmupMilestoneLocaleLengthRule implements RollingWarmupMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingWarmupMilestone): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingWarmupMilestoneAttemptsRangeRule implements RollingWarmupMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingWarmupMilestone): string[] {
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

/** Runs every rule of a rolling warmup milestone. */
export class RollingWarmupMilestoneValidator {
  rules: RollingWarmupMilestoneRule[];

  constructor(rules: RollingWarmupMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: RollingWarmupMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingWarmupMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingWarmupMilestone[]): Map<string, string[]> {
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

export function defaultRollingWarmupMilestoneValidator(): RollingWarmupMilestoneValidator {
  return new RollingWarmupMilestoneValidator(
    [
      new RollingWarmupMilestoneCodePrefixRule("X"),
      new RollingWarmupMilestoneLabelLengthRule(86400),
      new RollingWarmupMilestoneRequiredSummaryRule("rolling warmup milestone needs an entry"),
      new RollingWarmupMilestoneFrequencyCapRangeRule(16, 80),
      new RollingWarmupMilestoneLocaleLengthRule(32),
      new RollingWarmupMilestoneAttemptsRangeRule(64, 1000),
    ],
  );
}
