import { FraudCheckPreference } from "./fraud-check-preference.js";

/** A rule a fraud check preference must pass. Check returns its problems, or none. */
export interface FraudCheckPreferenceRule {
  check(item: FraudCheckPreference): string[];
}

export class FraudCheckPreferenceRequiredTimezoneRule implements FraudCheckPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckPreference): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckPreferenceCodeLengthRule implements FraudCheckPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckPreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckPreferenceCodePrefixRule implements FraudCheckPreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FraudCheckPreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FraudCheckPreferenceBatchSizeRangeRule implements FraudCheckPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FraudCheckPreference): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a fraud check preference. */
export class FraudCheckPreferenceValidator {
  rules: FraudCheckPreferenceRule[];

  constructor(rules: FraudCheckPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FraudCheckPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckPreference[]): Map<string, string[]> {
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

export function defaultFraudCheckPreferenceValidator(): FraudCheckPreferenceValidator {
  return new FraudCheckPreferenceValidator(
    [
      new FraudCheckPreferenceRequiredTimezoneRule("fraud check preference needs a value"),
      new FraudCheckPreferenceCodeLengthRule(16),
      new FraudCheckPreferenceCodePrefixRule("Q"),
      new FraudCheckPreferenceBatchSizeRangeRule(120, 255),
    ],
  );
}
