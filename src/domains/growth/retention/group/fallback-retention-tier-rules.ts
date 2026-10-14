import { FallbackRetentionTier } from "./fallback-retention-tier.js";

/** A rule a fallback retention tier must pass. Check returns its problems, or none. */
export interface FallbackRetentionTierRule {
  check(item: FallbackRetentionTier): string[];
}

export class FallbackRetentionTierTitleLengthRule implements FallbackRetentionTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackRetentionTier): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackRetentionTierRequiredCodeRule implements FallbackRetentionTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackRetentionTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackRetentionTierRequiredTitleRule implements FallbackRetentionTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackRetentionTier): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback retention tier. */
export class FallbackRetentionTierValidator {
  rules: FallbackRetentionTierRule[];

  constructor(rules: FallbackRetentionTierRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackRetentionTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackRetentionTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackRetentionTier[]): Map<string, string[]> {
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

export function defaultFallbackRetentionTierValidator(): FallbackRetentionTierValidator {
  return new FallbackRetentionTierValidator(
    [
      new FallbackRetentionTierTitleLengthRule(32),
      new FallbackRetentionTierRequiredCodeRule("fallback retention tier needs an entry"),
      new FallbackRetentionTierRequiredTitleRule("fallback retention tier needs an entry"),
    ],
  );
}
