import { WeightedExitRuleDigest } from "./weighted-exit-rule-digest.js";

/** A rule a weighted exit rule digest must pass. Check returns its problems, or none. */
export interface WeightedExitRuleDigestRule {
  check(item: WeightedExitRuleDigest): string[];
}

export class WeightedExitRuleDigestNameLengthRule implements WeightedExitRuleDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedExitRuleDigest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedExitRuleDigestCodeLengthRule implements WeightedExitRuleDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedExitRuleDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedExitRuleDigestPhoneLengthRule implements WeightedExitRuleDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedExitRuleDigest): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedExitRuleDigestRequiredPhoneRule implements WeightedExitRuleDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedExitRuleDigest): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedExitRuleDigestMaximumRangeRule implements WeightedExitRuleDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedExitRuleDigest): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a weighted exit rule digest. */
export class WeightedExitRuleDigestValidator {
  rules: WeightedExitRuleDigestRule[];

  constructor(rules: WeightedExitRuleDigestRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedExitRuleDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedExitRuleDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedExitRuleDigest[]): Map<string, string[]> {
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

export function defaultWeightedExitRuleDigestValidator(): WeightedExitRuleDigestValidator {
  return new WeightedExitRuleDigestValidator(
    [
      new WeightedExitRuleDigestNameLengthRule(86400),
      new WeightedExitRuleDigestCodeLengthRule(3600),
      new WeightedExitRuleDigestPhoneLengthRule(32),
      new WeightedExitRuleDigestRequiredPhoneRule("weighted exit rule digest needs a value"),
      new WeightedExitRuleDigestMaximumRangeRule(7.8, 1905.7),
    ],
  );
}
