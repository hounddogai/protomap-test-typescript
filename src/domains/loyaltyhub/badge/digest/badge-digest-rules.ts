import { BadgeDigest } from "./badge-digest.js";

/** A rule a badge digest must pass. Check returns its problems, or none. */
export interface BadgeDigestRule {
  check(item: BadgeDigest): string[];
}

export class BadgeDigestRequiredLocaleRule implements BadgeDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeDigest): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeDigestBatchSizeRangeRule implements BadgeDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeDigest): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BadgeDigestRequiredTitleRule implements BadgeDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeDigest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a badge digest. */
export class BadgeDigestValidator {
  rules: BadgeDigestRule[];

  constructor(rules: BadgeDigestRule[]) {
    this.rules = rules;
  }

  validate(item: BadgeDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BadgeDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgeDigest[]): Map<string, string[]> {
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

export function defaultBadgeDigestValidator(): BadgeDigestValidator {
  return new BadgeDigestValidator(
    [
      new BadgeDigestRequiredLocaleRule("badge digest needs an entry"),
      new BadgeDigestBatchSizeRangeRule(16, 64),
      new BadgeDigestRequiredTitleRule("badge digest needs an entry"),
    ],
  );
}
