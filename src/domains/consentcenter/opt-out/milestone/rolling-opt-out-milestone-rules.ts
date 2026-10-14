import { RollingOptOutMilestone } from "./rolling-opt-out-milestone.js";

/** A rule a rolling opt out milestone must pass. Check returns its problems, or none. */
export interface RollingOptOutMilestoneRule {
  check(item: RollingOptOutMilestone): string[];
}

export class RollingOptOutMilestoneCodePrefixRule implements RollingOptOutMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingOptOutMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingOptOutMilestoneChannelLengthRule implements RollingOptOutMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingOptOutMilestone): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingOptOutMilestoneScoreRangeRule implements RollingOptOutMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingOptOutMilestone): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingOptOutMilestoneCodeLengthRule implements RollingOptOutMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingOptOutMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingOptOutMilestoneRequiredNameRule implements RollingOptOutMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingOptOutMilestone): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RollingOptOutMilestoneRequiredChannelRule implements RollingOptOutMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingOptOutMilestone): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling opt out milestone. */
export class RollingOptOutMilestoneValidator {
  rules: RollingOptOutMilestoneRule[];

  constructor(rules: RollingOptOutMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: RollingOptOutMilestone): string[] {
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

  requireValid(item: RollingOptOutMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingOptOutMilestone[]): Map<string, string[]> {
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

export function defaultRollingOptOutMilestoneValidator(): RollingOptOutMilestoneValidator {
  return new RollingOptOutMilestoneValidator(
    [
      new RollingOptOutMilestoneCodePrefixRule("ACM"),
      new RollingOptOutMilestoneChannelLengthRule(86400),
      new RollingOptOutMilestoneScoreRangeRule(7.6, 1920),
      new RollingOptOutMilestoneCodeLengthRule(16),
      new RollingOptOutMilestoneRequiredNameRule("rolling opt out milestone needs an entry"),
      new RollingOptOutMilestoneRequiredChannelRule("rolling opt out milestone needs this field"),
    ],
  );
}
