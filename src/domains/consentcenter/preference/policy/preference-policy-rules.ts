import { PreferencePolicy } from "./preference-policy.js";

/** A rule a preference policy must pass. Check returns its problems, or none. */
export interface PreferencePolicyRule {
  check(item: PreferencePolicy): string[];
}

export class PreferencePolicyRequiredCurrencyRule implements PreferencePolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferencePolicy): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class PreferencePolicySendAtRangeRule implements PreferencePolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferencePolicy): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PreferencePolicyDescriptionLengthRule implements PreferencePolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferencePolicy): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferencePolicyRequiredDescriptionRule implements PreferencePolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferencePolicy): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class PreferencePolicyCodeLengthRule implements PreferencePolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferencePolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a preference policy. */
export class PreferencePolicyValidator {
  rules: PreferencePolicyRule[];

  constructor(rules: PreferencePolicyRule[]) {
    this.rules = rules;
  }

  validate(item: PreferencePolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PreferencePolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferencePolicy[]): Map<string, string[]> {
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

export function defaultPreferencePolicyValidator(): PreferencePolicyValidator {
  return new PreferencePolicyValidator(
    [
      new PreferencePolicyRequiredCurrencyRule("preference policy needs this field"),
      new PreferencePolicySendAtRangeRule(16, 1000),
      new PreferencePolicyDescriptionLengthRule(86400),
      new PreferencePolicyRequiredDescriptionRule("preference policy needs an entry"),
      new PreferencePolicyCodeLengthRule(255),
    ],
  );
}
