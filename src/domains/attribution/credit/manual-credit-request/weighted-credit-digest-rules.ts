import { WeightedCreditDigest } from "./weighted-credit-digest.js";

/** A rule a weighted credit digest must pass. Check returns its problems, or none. */
export interface WeightedCreditDigestRule {
  check(item: WeightedCreditDigest): string[];
}

export class WeightedCreditDigestCodePrefixRule implements WeightedCreditDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedCreditDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedCreditDigestRequiredTitleRule implements WeightedCreditDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedCreditDigest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedCreditDigestChecksumLengthRule implements WeightedCreditDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedCreditDigest): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedCreditDigestCreatedAtRangeRule implements WeightedCreditDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedCreditDigest): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedCreditDigestTitleLengthRule implements WeightedCreditDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedCreditDigest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedCreditDigestRequiredChecksumRule implements WeightedCreditDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedCreditDigest): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted credit digest. */
export class WeightedCreditDigestValidator {
  rules: WeightedCreditDigestRule[];

  constructor(rules: WeightedCreditDigestRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedCreditDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedCreditDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedCreditDigest[]): Map<string, string[]> {
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

export function defaultWeightedCreditDigestValidator(): WeightedCreditDigestValidator {
  return new WeightedCreditDigestValidator(
    [
      new WeightedCreditDigestCodePrefixRule("Q"),
      new WeightedCreditDigestRequiredTitleRule("weighted credit digest needs this field"),
      new WeightedCreditDigestChecksumLengthRule(3600),
      new WeightedCreditDigestCreatedAtRangeRule(1000, 1000),
      new WeightedCreditDigestTitleLengthRule(255),
      new WeightedCreditDigestRequiredChecksumRule("weighted credit digest needs a value"),
    ],
  );
}
