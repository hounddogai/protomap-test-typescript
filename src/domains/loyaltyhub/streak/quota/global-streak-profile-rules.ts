import * as text from "../../../../kit/text.js";
import { GlobalStreakProfile } from "./global-streak-profile.js";

/** A rule a global streak profile must pass. Check returns its problems, or none. */
export interface GlobalStreakProfileRule {
  check(item: GlobalStreakProfile): string[];
}

export class GlobalStreakProfileConversionRateRangeRule implements GlobalStreakProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalStreakProfile): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalStreakProfileCodeLengthRule implements GlobalStreakProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalStreakProfile): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalStreakProfileAllowedReviewerRule implements GlobalStreakProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalStreakProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is inconsistent`];
    return [];
  }
}

export class GlobalStreakProfileLabelLengthRule implements GlobalStreakProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalStreakProfile): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalStreakProfileRequiredCurrencyRule implements GlobalStreakProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalStreakProfile): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalStreakProfileCodePrefixRule implements GlobalStreakProfileRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalStreakProfile): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a global streak profile. */
export class GlobalStreakProfileValidator {
  rules: GlobalStreakProfileRule[];

  constructor(rules: GlobalStreakProfileRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalStreakProfile): string[] {
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

  requireValid(item: GlobalStreakProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalStreakProfile[]): Map<string, string[]> {
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

export function defaultGlobalStreakProfileValidator(): GlobalStreakProfileValidator {
  return new GlobalStreakProfileValidator(
    [
      new GlobalStreakProfileConversionRateRangeRule(6.4, 1954.3),
      new GlobalStreakProfileCodeLengthRule(64),
      new GlobalStreakProfileAllowedReviewerRule(["batched", "legacy"]),
      new GlobalStreakProfileLabelLengthRule(3600),
      new GlobalStreakProfileRequiredCurrencyRule("global streak profile needs a value"),
      new GlobalStreakProfileCodePrefixRule("REF"),
    ],
  );
}
