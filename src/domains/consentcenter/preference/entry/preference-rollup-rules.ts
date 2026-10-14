import * as text from "../../../../kit/text.js";
import { PreferenceRollup } from "./preference-rollup.js";

/** A rule a preference rollup must pass. Check returns its problems, or none. */
export interface PreferenceRollupRule {
  check(item: PreferenceRollup): string[];
}

export class PreferenceRollupFloorValueRangeRule implements PreferenceRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceRollup): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PreferenceRollupAllowedCodeRule implements PreferenceRollupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PreferenceRollup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class PreferenceRollupTimezoneLengthRule implements PreferenceRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceRollup): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceRollupExpiresAtRangeRule implements PreferenceRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceRollup): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PreferenceRollupRequiredTimezoneRule implements PreferenceRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceRollup): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceRollupCodePrefixRule implements PreferenceRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PreferenceRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a preference rollup. */
export class PreferenceRollupValidator {
  rules: PreferenceRollupRule[];

  constructor(rules: PreferenceRollupRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceRollup): string[] {
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

  requireValid(item: PreferenceRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceRollup[]): Map<string, string[]> {
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

export function defaultPreferenceRollupValidator(): PreferenceRollupValidator {
  return new PreferenceRollupValidator(
    [
      new PreferenceRollupFloorValueRangeRule(8, 2782.5),
      new PreferenceRollupAllowedCodeRule([]),
      new PreferenceRollupTimezoneLengthRule(16),
      new PreferenceRollupExpiresAtRangeRule(64, 1000),
      new PreferenceRollupRequiredTimezoneRule("preference rollup needs an entry"),
      new PreferenceRollupCodePrefixRule("Q"),
    ],
  );
}
