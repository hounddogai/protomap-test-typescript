import { WeightedActivationDigest } from "./weighted-activation-digest.js";

/** A rule a weighted activation digest must pass. Check returns its problems, or none. */
export interface WeightedActivationDigestRule {
  check(item: WeightedActivationDigest): string[];
}

export class WeightedActivationDigestCodeLengthRule implements WeightedActivationDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedActivationDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedActivationDigestCodePrefixRule implements WeightedActivationDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedActivationDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedActivationDigestAttemptsRangeRule implements WeightedActivationDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedActivationDigest): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a weighted activation digest. */
export class WeightedActivationDigestValidator {
  rules: WeightedActivationDigestRule[];

  constructor(rules: WeightedActivationDigestRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedActivationDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedActivationDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedActivationDigest[]): Map<string, string[]> {
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

export function defaultWeightedActivationDigestValidator(): WeightedActivationDigestValidator {
  return new WeightedActivationDigestValidator(
    [
      new WeightedActivationDigestCodeLengthRule(32),
      new WeightedActivationDigestCodePrefixRule("REF"),
      new WeightedActivationDigestAttemptsRangeRule(64, 80),
    ],
  );
}
