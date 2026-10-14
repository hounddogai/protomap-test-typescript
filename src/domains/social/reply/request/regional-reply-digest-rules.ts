import { RegionalReplyDigest } from "./regional-reply-digest.js";

/** A rule a regional reply digest must pass. Check returns its problems, or none. */
export interface RegionalReplyDigestRule {
  check(item: RegionalReplyDigest): string[];
}

export class RegionalReplyDigestTitleLengthRule implements RegionalReplyDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalReplyDigest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalReplyDigestVersionRangeRule implements RegionalReplyDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalReplyDigest): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalReplyDigestRequiredTitleRule implements RegionalReplyDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalReplyDigest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalReplyDigestBudgetRangeRule implements RegionalReplyDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalReplyDigest): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a regional reply digest. */
export class RegionalReplyDigestValidator {
  rules: RegionalReplyDigestRule[];

  constructor(rules: RegionalReplyDigestRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalReplyDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalReplyDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalReplyDigest[]): Map<string, string[]> {
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

export function defaultRegionalReplyDigestValidator(): RegionalReplyDigestValidator {
  return new RegionalReplyDigestValidator(
    [
      new RegionalReplyDigestTitleLengthRule(64),
      new RegionalReplyDigestVersionRangeRule(32, 255),
      new RegionalReplyDigestRequiredTitleRule("regional reply digest needs an entry"),
      new RegionalReplyDigestBudgetRangeRule(6.9, 3013),
    ],
  );
}
