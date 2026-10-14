import { FallbackBouncePreference } from "./fallback-bounce-preference.js";

/** A rule a fallback bounce preference must pass. Check returns its problems, or none. */
export interface FallbackBouncePreferenceRule {
  check(item: FallbackBouncePreference): string[];
}

export class FallbackBouncePreferenceCodePrefixRule implements FallbackBouncePreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackBouncePreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackBouncePreferenceRequiredCurrencyRule implements FallbackBouncePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackBouncePreference): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackBouncePreferenceCapacityRangeRule implements FallbackBouncePreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackBouncePreference): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a fallback bounce preference. */
export class FallbackBouncePreferenceValidator {
  rules: FallbackBouncePreferenceRule[];

  constructor(rules: FallbackBouncePreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackBouncePreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackBouncePreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackBouncePreference[]): Map<string, string[]> {
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

export function defaultFallbackBouncePreferenceValidator(): FallbackBouncePreferenceValidator {
  return new FallbackBouncePreferenceValidator(
    [
      new FallbackBouncePreferenceCodePrefixRule("REF"),
      new FallbackBouncePreferenceRequiredCurrencyRule("fallback bounce preference needs this field"),
      new FallbackBouncePreferenceCapacityRangeRule(80, 3600),
    ],
  );
}
