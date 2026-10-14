import { WeightedPreferencePolicy } from "./weighted-preference-policy.js";

/** A rule a weighted preference policy must pass. Check returns its problems, or none. */
export interface WeightedPreferencePolicyRule {
  check(item: WeightedPreferencePolicy): string[];
}

export class WeightedPreferencePolicyCodeLengthRule implements WeightedPreferencePolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedPreferencePolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedPreferencePolicyRequiredRegionRule implements WeightedPreferencePolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPreferencePolicy): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedPreferencePolicyRequiredLocaleRule implements WeightedPreferencePolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPreferencePolicy): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedPreferencePolicyRequiredCodeRule implements WeightedPreferencePolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPreferencePolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedPreferencePolicyLocaleLengthRule implements WeightedPreferencePolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedPreferencePolicy): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedPreferencePolicyRetriesRangeRule implements WeightedPreferencePolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedPreferencePolicy): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a weighted preference policy. */
export class WeightedPreferencePolicyValidator {
  rules: WeightedPreferencePolicyRule[];

  constructor(rules: WeightedPreferencePolicyRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedPreferencePolicy): string[] {
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

  requireValid(item: WeightedPreferencePolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedPreferencePolicy[]): Map<string, string[]> {
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

export function defaultWeightedPreferencePolicyValidator(): WeightedPreferencePolicyValidator {
  return new WeightedPreferencePolicyValidator(
    [
      new WeightedPreferencePolicyCodeLengthRule(120),
      new WeightedPreferencePolicyRequiredRegionRule("weighted preference policy needs an entry"),
      new WeightedPreferencePolicyRequiredLocaleRule("weighted preference policy needs this field"),
      new WeightedPreferencePolicyRequiredCodeRule("weighted preference policy needs a value"),
      new WeightedPreferencePolicyLocaleLengthRule(120),
      new WeightedPreferencePolicyRetriesRangeRule(16, 64),
    ],
  );
}
