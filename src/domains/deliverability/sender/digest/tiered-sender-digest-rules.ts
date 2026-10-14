import { TieredSenderDigest } from "./tiered-sender-digest.js";

/** A rule a tiered sender digest must pass. Check returns its problems, or none. */
export interface TieredSenderDigestRule {
  check(item: TieredSenderDigest): string[];
}

export class TieredSenderDigestTitleLengthRule implements TieredSenderDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredSenderDigest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredSenderDigestRequiredCodeRule implements TieredSenderDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredSenderDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredSenderDigestCodePrefixRule implements TieredSenderDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredSenderDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredSenderDigestCapacityRangeRule implements TieredSenderDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredSenderDigest): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredSenderDigestRequiredExternalRefRule implements TieredSenderDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredSenderDigest): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class TieredSenderDigestRequiredTitleRule implements TieredSenderDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredSenderDigest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered sender digest. */
export class TieredSenderDigestValidator {
  rules: TieredSenderDigestRule[];

  constructor(rules: TieredSenderDigestRule[]) {
    this.rules = rules;
  }

  validate(item: TieredSenderDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredSenderDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredSenderDigest[]): Map<string, string[]> {
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

export function defaultTieredSenderDigestValidator(): TieredSenderDigestValidator {
  return new TieredSenderDigestValidator(
    [
      new TieredSenderDigestTitleLengthRule(64),
      new TieredSenderDigestRequiredCodeRule("tiered sender digest needs this field"),
      new TieredSenderDigestCodePrefixRule("REF"),
      new TieredSenderDigestCapacityRangeRule(16, 32),
      new TieredSenderDigestRequiredExternalRefRule("tiered sender digest needs a value"),
      new TieredSenderDigestRequiredTitleRule("tiered sender digest needs this field"),
    ],
  );
}
