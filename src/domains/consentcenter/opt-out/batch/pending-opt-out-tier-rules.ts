import { PendingOptOutTier } from "./pending-opt-out-tier.js";

/** A rule a pending opt out tier must pass. Check returns its problems, or none. */
export interface PendingOptOutTierRule {
  check(item: PendingOptOutTier): string[];
}

export class PendingOptOutTierCodeLengthRule implements PendingOptOutTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingOptOutTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingOptOutTierRequiredCodeRule implements PendingOptOutTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingOptOutTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingOptOutTierCodePrefixRule implements PendingOptOutTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingOptOutTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingOptOutTierBatchSizeRangeRule implements PendingOptOutTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingOptOutTier): string[] {
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

/** Runs every rule of a pending opt out tier. */
export class PendingOptOutTierValidator {
  rules: PendingOptOutTierRule[];

  constructor(rules: PendingOptOutTierRule[]) {
    this.rules = rules;
  }

  validate(item: PendingOptOutTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingOptOutTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingOptOutTier[]): Map<string, string[]> {
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

export function defaultPendingOptOutTierValidator(): PendingOptOutTierValidator {
  return new PendingOptOutTierValidator(
    [
      new PendingOptOutTierCodeLengthRule(80),
      new PendingOptOutTierRequiredCodeRule("pending opt out tier needs a value"),
      new PendingOptOutTierCodePrefixRule("ACM"),
      new PendingOptOutTierBatchSizeRangeRule(16, 120),
    ],
  );
}
