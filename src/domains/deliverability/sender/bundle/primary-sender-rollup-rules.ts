import * as text from "../../../../kit/text.js";
import { PrimarySenderRollup } from "./primary-sender-rollup.js";

/** A rule a primary sender rollup must pass. Check returns its problems, or none. */
export interface PrimarySenderRollupRule {
  check(item: PrimarySenderRollup): string[];
}

export class PrimarySenderRollupConversionRateRangeRule implements PrimarySenderRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimarySenderRollup): string[] {
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

export class PrimarySenderRollupCodePrefixRule implements PrimarySenderRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimarySenderRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimarySenderRollupSourceLengthRule implements PrimarySenderRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimarySenderRollup): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimarySenderRollupAllowedUtmSourceRule implements PrimarySenderRollupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimarySenderRollup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is too long`];
    return [];
  }
}

export class PrimarySenderRollupRequiredSourceRule implements PrimarySenderRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimarySenderRollup): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary sender rollup. */
export class PrimarySenderRollupValidator {
  rules: PrimarySenderRollupRule[];

  constructor(rules: PrimarySenderRollupRule[]) {
    this.rules = rules;
  }

  validate(item: PrimarySenderRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimarySenderRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimarySenderRollup[]): Map<string, string[]> {
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

export function defaultPrimarySenderRollupValidator(): PrimarySenderRollupValidator {
  return new PrimarySenderRollupValidator(
    [
      new PrimarySenderRollupConversionRateRangeRule(8.9, 1277.7),
      new PrimarySenderRollupCodePrefixRule("REF"),
      new PrimarySenderRollupSourceLengthRule(255),
      new PrimarySenderRollupAllowedUtmSourceRule([]),
      new PrimarySenderRollupRequiredSourceRule("primary sender rollup needs this field"),
    ],
  );
}
