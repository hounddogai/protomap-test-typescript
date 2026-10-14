import { ScheduledMentionDigest } from "./scheduled-mention-digest.js";

/** A rule a scheduled mention digest must pass. Check returns its problems, or none. */
export interface ScheduledMentionDigestRule {
  check(item: ScheduledMentionDigest): string[];
}

export class ScheduledMentionDigestRequiredCampaignRefRule implements ScheduledMentionDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledMentionDigest): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledMentionDigestVisibleGuardRule implements ScheduledMentionDigestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ScheduledMentionDigest): string[] {
    if (item.visible && item.attempts > this.limit) return [`attempts ${item.attempts} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class ScheduledMentionDigestCodeLengthRule implements ScheduledMentionDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledMentionDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledMentionDigestCostRangeRule implements ScheduledMentionDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledMentionDigest): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledMentionDigestTitleLengthRule implements ScheduledMentionDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledMentionDigest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled mention digest. */
export class ScheduledMentionDigestValidator {
  rules: ScheduledMentionDigestRule[];

  constructor(rules: ScheduledMentionDigestRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledMentionDigest): string[] {
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

  requireValid(item: ScheduledMentionDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledMentionDigest[]): Map<string, string[]> {
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

export function defaultScheduledMentionDigestValidator(): ScheduledMentionDigestValidator {
  return new ScheduledMentionDigestValidator(
    [
      new ScheduledMentionDigestRequiredCampaignRefRule("scheduled mention digest needs an entry"),
      new ScheduledMentionDigestVisibleGuardRule(86400),
      new ScheduledMentionDigestCodeLengthRule(16),
      new ScheduledMentionDigestCostRangeRule(2.3, 1568.7),
      new ScheduledMentionDigestTitleLengthRule(1000),
    ],
  );
}
