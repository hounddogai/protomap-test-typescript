import { FrequencyDigest } from "./frequency-digest.js";

/** A rule a frequency digest must pass. Check returns its problems, or none. */
export interface FrequencyDigestRule {
  check(item: FrequencyDigest): string[];
}

export class FrequencyDigestTitleLengthRule implements FrequencyDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyDigest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyDigestRequiredTitleRule implements FrequencyDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyDigest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencyDigestRequiredNameRule implements FrequencyDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyDigest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencyDigestUnitLengthRule implements FrequencyDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyDigest): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyDigestAmountRangeRule implements FrequencyDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencyDigest): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FrequencyDigestCodeLengthRule implements FrequencyDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a frequency digest. */
export class FrequencyDigestValidator {
  rules: FrequencyDigestRule[];

  constructor(rules: FrequencyDigestRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencyDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      const found = rule.check(item);
      if (found.length === 0) continue;
      for (const problem of found) {
        problems.push(`${item.code}: ${problem}`);
      }
    }
    return problems;
  }

  requireValid(item: FrequencyDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencyDigest[]): Map<string, string[]> {
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

export function defaultFrequencyDigestValidator(): FrequencyDigestValidator {
  return new FrequencyDigestValidator(
    [
      new FrequencyDigestTitleLengthRule(255),
      new FrequencyDigestRequiredTitleRule("frequency digest needs an entry"),
      new FrequencyDigestRequiredNameRule("frequency digest needs this field"),
      new FrequencyDigestUnitLengthRule(1000),
      new FrequencyDigestAmountRangeRule(5.9, 3553.1),
      new FrequencyDigestCodeLengthRule(1000),
    ],
  );
}
