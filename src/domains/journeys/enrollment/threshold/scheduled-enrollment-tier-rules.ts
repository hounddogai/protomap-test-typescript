import { ScheduledEnrollmentTier } from "./scheduled-enrollment-tier.js";

/** A rule a scheduled enrollment tier must pass. Check returns its problems, or none. */
export interface ScheduledEnrollmentTierRule {
  check(item: ScheduledEnrollmentTier): string[];
}

export class ScheduledEnrollmentTierTagsLimitRule implements ScheduledEnrollmentTierRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: ScheduledEnrollmentTier): string[] {
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

export class ScheduledEnrollmentTierCodeLengthRule implements ScheduledEnrollmentTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledEnrollmentTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledEnrollmentTierTitleLengthRule implements ScheduledEnrollmentTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledEnrollmentTier): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled enrollment tier. */
export class ScheduledEnrollmentTierValidator {
  rules: ScheduledEnrollmentTierRule[];

  constructor(rules: ScheduledEnrollmentTierRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledEnrollmentTier): string[] {
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

  requireValid(item: ScheduledEnrollmentTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledEnrollmentTier[]): Map<string, string[]> {
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

export function defaultScheduledEnrollmentTierValidator(): ScheduledEnrollmentTierValidator {
  return new ScheduledEnrollmentTierValidator(
    [
      new ScheduledEnrollmentTierTagsLimitRule(255, []),
      new ScheduledEnrollmentTierCodeLengthRule(255),
      new ScheduledEnrollmentTierTitleLengthRule(80),
    ],
  );
}
