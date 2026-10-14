import { FrequencyAgreement } from "./frequency-agreement.js";

/** A rule a frequency agreement must pass. Check returns its problems, or none. */
export interface FrequencyAgreementRule {
  check(item: FrequencyAgreement): string[];
}

export class FrequencyAgreementImpressionsRangeRule implements FrequencyAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencyAgreement): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FrequencyAgreementLabelLengthRule implements FrequencyAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyAgreement): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyAgreementExpiresAtRangeRule implements FrequencyAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencyAgreement): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FrequencyAgreementCodeLengthRule implements FrequencyAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyAgreementVersionRangeRule implements FrequencyAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencyAgreement): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FrequencyAgreementDiscountRangeRule implements FrequencyAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencyAgreement): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a frequency agreement. */
export class FrequencyAgreementValidator {
  rules: FrequencyAgreementRule[];

  constructor(rules: FrequencyAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencyAgreement): string[] {
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

  requireValid(item: FrequencyAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencyAgreement[]): Map<string, string[]> {
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

export function defaultFrequencyAgreementValidator(): FrequencyAgreementValidator {
  return new FrequencyAgreementValidator(
    [
      new FrequencyAgreementImpressionsRangeRule(120, 1000),
      new FrequencyAgreementLabelLengthRule(86400),
      new FrequencyAgreementExpiresAtRangeRule(80, 86400),
      new FrequencyAgreementCodeLengthRule(80),
      new FrequencyAgreementVersionRangeRule(16, 64),
      new FrequencyAgreementDiscountRangeRule(1.9, 2048.7),
    ],
  );
}
