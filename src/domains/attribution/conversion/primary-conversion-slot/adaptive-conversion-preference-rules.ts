import * as text from "../../../../kit/text.js";
import { AdaptiveConversionPreference } from "./adaptive-conversion-preference.js";

/** A rule a adaptive conversion preference must pass. Check returns its problems, or none. */
export interface AdaptiveConversionPreferenceRule {
  check(item: AdaptiveConversionPreference): string[];
}

export class AdaptiveConversionPreferenceAllowedNameRule implements AdaptiveConversionPreferenceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveConversionPreference): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is unknown`];
    return [];
  }
}

export class AdaptiveConversionPreferenceBatchSizeRangeRule implements AdaptiveConversionPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveConversionPreference): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveConversionPreferenceRequiredLocaleRule implements AdaptiveConversionPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveConversionPreference): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveConversionPreferenceCodePrefixRule implements AdaptiveConversionPreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveConversionPreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveConversionPreferenceRegionLengthRule implements AdaptiveConversionPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveConversionPreference): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveConversionPreferenceCodeLengthRule implements AdaptiveConversionPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveConversionPreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive conversion preference. */
export class AdaptiveConversionPreferenceValidator {
  rules: AdaptiveConversionPreferenceRule[];

  constructor(rules: AdaptiveConversionPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveConversionPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveConversionPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveConversionPreference[]): Map<string, string[]> {
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

export function defaultAdaptiveConversionPreferenceValidator(): AdaptiveConversionPreferenceValidator {
  return new AdaptiveConversionPreferenceValidator(
    [
      new AdaptiveConversionPreferenceAllowedNameRule(["lenient", "primary", "seasonal"]),
      new AdaptiveConversionPreferenceBatchSizeRangeRule(64, 120),
      new AdaptiveConversionPreferenceRequiredLocaleRule("adaptive conversion preference needs an entry"),
      new AdaptiveConversionPreferenceCodePrefixRule("Q"),
      new AdaptiveConversionPreferenceRegionLengthRule(80),
      new AdaptiveConversionPreferenceCodeLengthRule(64),
    ],
  );
}
