import * as text from "../../../../kit/text.js";
import { PrimaryPreferenceGroup } from "./primary-preference-group.js";

/** A rule a primary preference group must pass. Check returns its problems, or none. */
export interface PrimaryPreferenceGroupRule {
  check(item: PrimaryPreferenceGroup): string[];
}

export class PrimaryPreferenceGroupRequiredTitleRule implements PrimaryPreferenceGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryPreferenceGroup): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryPreferenceGroupRequiredCodeRule implements PrimaryPreferenceGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryPreferenceGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryPreferenceGroupAllowedTimezoneRule implements PrimaryPreferenceGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryPreferenceGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is too long`];
    return [];
  }
}

export class PrimaryPreferenceGroupDiscountRangeRule implements PrimaryPreferenceGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryPreferenceGroup): string[] {
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

export class PrimaryPreferenceGroupCodePrefixRule implements PrimaryPreferenceGroupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryPreferenceGroup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryPreferenceGroupTimezoneLengthRule implements PrimaryPreferenceGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryPreferenceGroup): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary preference group. */
export class PrimaryPreferenceGroupValidator {
  rules: PrimaryPreferenceGroupRule[];

  constructor(rules: PrimaryPreferenceGroupRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryPreferenceGroup): string[] {
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

  requireValid(item: PrimaryPreferenceGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryPreferenceGroup[]): Map<string, string[]> {
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

export function defaultPrimaryPreferenceGroupValidator(): PrimaryPreferenceGroupValidator {
  return new PrimaryPreferenceGroupValidator(
    [
      new PrimaryPreferenceGroupRequiredTitleRule("primary preference group needs a value"),
      new PrimaryPreferenceGroupRequiredCodeRule("primary preference group needs an entry"),
      new PrimaryPreferenceGroupAllowedTimezoneRule(["scheduled", "capped", "lenient"]),
      new PrimaryPreferenceGroupDiscountRangeRule(8, 2418.1),
      new PrimaryPreferenceGroupCodePrefixRule("X"),
      new PrimaryPreferenceGroupTimezoneLengthRule(1000),
    ],
  );
}
