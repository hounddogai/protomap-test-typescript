import { FrequencyPolicy } from "./frequency-policy.js";

/** A rule a frequency policy must pass. Check returns its problems, or none. */
export interface FrequencyPolicyRule {
  check(item: FrequencyPolicy): string[];
}

export class FrequencyPolicyCodeLengthRule implements FrequencyPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyPolicyLimitRangeRule implements FrequencyPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencyPolicy): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FrequencyPolicyRequiredTitleRule implements FrequencyPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyPolicy): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencyPolicyRequiredChecksumRule implements FrequencyPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyPolicy): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a frequency policy. */
export class FrequencyPolicyValidator {
  rules: FrequencyPolicyRule[];

  constructor(rules: FrequencyPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencyPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FrequencyPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencyPolicy[]): Map<string, string[]> {
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

export function defaultFrequencyPolicyValidator(): FrequencyPolicyValidator {
  return new FrequencyPolicyValidator(
    [
      new FrequencyPolicyCodeLengthRule(80),
      new FrequencyPolicyLimitRangeRule(16, 80),
      new FrequencyPolicyRequiredTitleRule("frequency policy needs this field"),
      new FrequencyPolicyRequiredChecksumRule("frequency policy needs this field"),
    ],
  );
}
