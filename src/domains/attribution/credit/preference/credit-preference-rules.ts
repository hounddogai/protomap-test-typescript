import { CreditPreference } from "./credit-preference.js";

/** A rule a credit preference must pass. Check returns its problems, or none. */
export interface CreditPreferenceRule {
  check(item: CreditPreference): string[];
}

export class CreditPreferencePriorityRangeRule implements CreditPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditPreference): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CreditPreferenceEndsAtRangeRule implements CreditPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditPreference): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CreditPreferenceSourceLengthRule implements CreditPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditPreference): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditPreferenceRequiredSourceRule implements CreditPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditPreference): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class CreditPreferenceCodePrefixRule implements CreditPreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreditPreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a credit preference. */
export class CreditPreferenceValidator {
  rules: CreditPreferenceRule[];

  constructor(rules: CreditPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: CreditPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreditPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditPreference[]): Map<string, string[]> {
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

export function defaultCreditPreferenceValidator(): CreditPreferenceValidator {
  return new CreditPreferenceValidator(
    [
      new CreditPreferencePriorityRangeRule(64, 1000),
      new CreditPreferenceEndsAtRangeRule(32, 64),
      new CreditPreferenceSourceLengthRule(1000),
      new CreditPreferenceRequiredSourceRule("credit preference needs a value"),
      new CreditPreferenceCodePrefixRule("ACM"),
    ],
  );
}
