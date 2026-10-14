import { PrimaryDeflectionBaseline } from "./primary-deflection-baseline.js";

/** A rule a primary deflection baseline must pass. Check returns its problems, or none. */
export interface PrimaryDeflectionBaselineRule {
  check(item: PrimaryDeflectionBaseline): string[];
}

export class PrimaryDeflectionBaselineRequiredChecksumRule implements PrimaryDeflectionBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryDeflectionBaseline): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryDeflectionBaselineCeilingRangeRule implements PrimaryDeflectionBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryDeflectionBaseline): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryDeflectionBaselineClicksRangeRule implements PrimaryDeflectionBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryDeflectionBaseline): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryDeflectionBaselineCodePrefixRule implements PrimaryDeflectionBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryDeflectionBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryDeflectionBaselineTitleLengthRule implements PrimaryDeflectionBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryDeflectionBaseline): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryDeflectionBaselineLimitRangeRule implements PrimaryDeflectionBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryDeflectionBaseline): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a primary deflection baseline. */
export class PrimaryDeflectionBaselineValidator {
  rules: PrimaryDeflectionBaselineRule[];

  constructor(rules: PrimaryDeflectionBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryDeflectionBaseline): string[] {
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

  requireValid(item: PrimaryDeflectionBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryDeflectionBaseline[]): Map<string, string[]> {
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

export function defaultPrimaryDeflectionBaselineValidator(): PrimaryDeflectionBaselineValidator {
  return new PrimaryDeflectionBaselineValidator(
    [
      new PrimaryDeflectionBaselineRequiredChecksumRule("primary deflection baseline needs this field"),
      new PrimaryDeflectionBaselineCeilingRangeRule(0.4, 2860.3),
      new PrimaryDeflectionBaselineClicksRangeRule(64, 120),
      new PrimaryDeflectionBaselineCodePrefixRule("Q"),
      new PrimaryDeflectionBaselineTitleLengthRule(1000),
      new PrimaryDeflectionBaselineLimitRangeRule(120, 1000),
    ],
  );
}
