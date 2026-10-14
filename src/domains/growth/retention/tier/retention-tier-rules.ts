import { RetentionTier } from "./retention-tier.js";

/** A rule a retention tier must pass. Check returns its problems, or none. */
export interface RetentionTierRule {
  check(item: RetentionTier): string[];
}

export class RetentionTierCodeLengthRule implements RetentionTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionTierActiveGuardRule implements RetentionTierRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RetentionTier): string[] {
    if (item.active && item.startsAt > this.limit) return [`starts at ${item.startsAt} exceeds ${this.limit} while active`];
    return [];
  }
}

export class RetentionTierRequiredCodeRule implements RetentionTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionTierRequiredTitleRule implements RetentionTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionTier): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionTierStartsAtRangeRule implements RetentionTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionTier): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a retention tier. */
export class RetentionTierValidator {
  rules: RetentionTierRule[];

  constructor(rules: RetentionTierRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RetentionTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionTier[]): Map<string, string[]> {
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

export function defaultRetentionTierValidator(): RetentionTierValidator {
  return new RetentionTierValidator(
    [
      new RetentionTierCodeLengthRule(80),
      new RetentionTierActiveGuardRule(64),
      new RetentionTierRequiredCodeRule("retention tier needs an entry"),
      new RetentionTierRequiredTitleRule("retention tier needs an entry"),
      new RetentionTierStartsAtRangeRule(255, 255),
    ],
  );
}
