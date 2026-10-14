import { ScheduledBadgeMilestone } from "./scheduled-badge-milestone.js";

/** A rule a scheduled badge milestone must pass. Check returns its problems, or none. */
export interface ScheduledBadgeMilestoneRule {
  check(item: ScheduledBadgeMilestone): string[];
}

export class ScheduledBadgeMilestoneEndsAtRangeRule implements ScheduledBadgeMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledBadgeMilestone): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledBadgeMilestoneCodeLengthRule implements ScheduledBadgeMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledBadgeMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledBadgeMilestoneRequiredNameRule implements ScheduledBadgeMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledBadgeMilestone): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledBadgeMilestoneTagsLimitRule implements ScheduledBadgeMilestoneRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: ScheduledBadgeMilestone): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class ScheduledBadgeMilestoneImpressionsRangeRule implements ScheduledBadgeMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledBadgeMilestone): string[] {
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

export class ScheduledBadgeMilestoneCodePrefixRule implements ScheduledBadgeMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledBadgeMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a scheduled badge milestone. */
export class ScheduledBadgeMilestoneValidator {
  rules: ScheduledBadgeMilestoneRule[];

  constructor(rules: ScheduledBadgeMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledBadgeMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledBadgeMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledBadgeMilestone[]): Map<string, string[]> {
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

export function defaultScheduledBadgeMilestoneValidator(): ScheduledBadgeMilestoneValidator {
  return new ScheduledBadgeMilestoneValidator(
    [
      new ScheduledBadgeMilestoneEndsAtRangeRule(1000, 1000),
      new ScheduledBadgeMilestoneCodeLengthRule(32),
      new ScheduledBadgeMilestoneRequiredNameRule("scheduled badge milestone needs this field"),
      new ScheduledBadgeMilestoneTagsLimitRule(120, []),
      new ScheduledBadgeMilestoneImpressionsRangeRule(64, 80),
      new ScheduledBadgeMilestoneCodePrefixRule("REF"),
    ],
  );
}
