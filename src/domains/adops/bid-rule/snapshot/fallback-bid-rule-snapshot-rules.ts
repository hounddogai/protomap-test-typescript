import { FallbackBidRuleSnapshot } from "./fallback-bid-rule-snapshot.js";

/** A rule a fallback bid rule snapshot must pass. Check returns its problems, or none. */
export interface FallbackBidRuleSnapshotRule {
  check(item: FallbackBidRuleSnapshot): string[];
}

export class FallbackBidRuleSnapshotUpdatedAtRangeRule implements FallbackBidRuleSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackBidRuleSnapshot): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackBidRuleSnapshotTimezoneLengthRule implements FallbackBidRuleSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackBidRuleSnapshot): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackBidRuleSnapshotCodeLengthRule implements FallbackBidRuleSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackBidRuleSnapshot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackBidRuleSnapshotRequiredTimezoneRule implements FallbackBidRuleSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackBidRuleSnapshot): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback bid rule snapshot. */
export class FallbackBidRuleSnapshotValidator {
  rules: FallbackBidRuleSnapshotRule[];

  constructor(rules: FallbackBidRuleSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackBidRuleSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackBidRuleSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackBidRuleSnapshot[]): Map<string, string[]> {
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

export function defaultFallbackBidRuleSnapshotValidator(): FallbackBidRuleSnapshotValidator {
  return new FallbackBidRuleSnapshotValidator(
    [
      new FallbackBidRuleSnapshotUpdatedAtRangeRule(16, 1000),
      new FallbackBidRuleSnapshotTimezoneLengthRule(3600),
      new FallbackBidRuleSnapshotCodeLengthRule(3600),
      new FallbackBidRuleSnapshotRequiredTimezoneRule("fallback bid rule snapshot needs an entry"),
    ],
  );
}
