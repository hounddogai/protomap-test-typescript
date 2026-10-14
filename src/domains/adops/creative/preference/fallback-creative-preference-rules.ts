import { FallbackCreativePreference } from "./fallback-creative-preference.js";

/** A rule a fallback creative preference must pass. Check returns its problems, or none. */
export interface FallbackCreativePreferenceRule {
  check(item: FallbackCreativePreference): string[];
}

export class FallbackCreativePreferenceRequiredRegionRule implements FallbackCreativePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackCreativePreference): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackCreativePreferenceCodeLengthRule implements FallbackCreativePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackCreativePreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackCreativePreferenceTitleLengthRule implements FallbackCreativePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackCreativePreference): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackCreativePreferenceCodePrefixRule implements FallbackCreativePreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackCreativePreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackCreativePreferenceVersionRangeRule implements FallbackCreativePreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackCreativePreference): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackCreativePreferenceRequiredCodeRule implements FallbackCreativePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackCreativePreference): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback creative preference. */
export class FallbackCreativePreferenceValidator {
  rules: FallbackCreativePreferenceRule[];

  constructor(rules: FallbackCreativePreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackCreativePreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackCreativePreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackCreativePreference[]): Map<string, string[]> {
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

export function defaultFallbackCreativePreferenceValidator(): FallbackCreativePreferenceValidator {
  return new FallbackCreativePreferenceValidator(
    [
      new FallbackCreativePreferenceRequiredRegionRule("fallback creative preference needs this field"),
      new FallbackCreativePreferenceCodeLengthRule(64),
      new FallbackCreativePreferenceTitleLengthRule(1000),
      new FallbackCreativePreferenceCodePrefixRule("ACM"),
      new FallbackCreativePreferenceVersionRangeRule(16, 80),
      new FallbackCreativePreferenceRequiredCodeRule("fallback creative preference needs this field"),
    ],
  );
}
