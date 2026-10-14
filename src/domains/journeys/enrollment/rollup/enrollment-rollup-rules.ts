import * as text from "../../../../kit/text.js";
import { EnrollmentRollup } from "./enrollment-rollup.js";

/** A rule a enrollment rollup must pass. Check returns its problems, or none. */
export interface EnrollmentRollupRule {
  check(item: EnrollmentRollup): string[];
}

export class EnrollmentRollupGraceDaysRangeRule implements EnrollmentRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentRollup): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EnrollmentRollupRequiredChannelRule implements EnrollmentRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentRollup): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentRollupCodeLengthRule implements EnrollmentRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentRollupAllowedChannelRule implements EnrollmentRollupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: EnrollmentRollup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is expired`];
    return [];
  }
}

export class EnrollmentRollupRequiredLabelRule implements EnrollmentRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentRollup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentRollupCodePrefixRule implements EnrollmentRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EnrollmentRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a enrollment rollup. */
export class EnrollmentRollupValidator {
  rules: EnrollmentRollupRule[];

  constructor(rules: EnrollmentRollupRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentRollup): string[] {
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

  requireValid(item: EnrollmentRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentRollup[]): Map<string, string[]> {
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

export function defaultEnrollmentRollupValidator(): EnrollmentRollupValidator {
  return new EnrollmentRollupValidator(
    [
      new EnrollmentRollupGraceDaysRangeRule(120, 86400),
      new EnrollmentRollupRequiredChannelRule("enrollment rollup needs an entry"),
      new EnrollmentRollupCodeLengthRule(86400),
      new EnrollmentRollupAllowedChannelRule(["capped", "regional"]),
      new EnrollmentRollupRequiredLabelRule("enrollment rollup needs a value"),
      new EnrollmentRollupCodePrefixRule("REF"),
    ],
  );
}
