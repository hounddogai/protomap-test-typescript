import * as text from "../../../../kit/text.js";
import { StrictLevelVariance } from "./strict-level-variance.js";

/** A rule a strict level variance must pass. Check returns its problems, or none. */
export interface StrictLevelVarianceRule {
  check(item: StrictLevelVariance): string[];
}

export class StrictLevelVarianceCodeLengthRule implements StrictLevelVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictLevelVariance): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictLevelVarianceAllowedCountryRule implements StrictLevelVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictLevelVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is stale`];
    return [];
  }
}

export class StrictLevelVarianceLabelLengthRule implements StrictLevelVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictLevelVariance): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictLevelVarianceCodePrefixRule implements StrictLevelVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictLevelVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictLevelVarianceRequiredCountryRule implements StrictLevelVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictLevelVariance): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class StrictLevelVarianceQuantityRangeRule implements StrictLevelVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictLevelVariance): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a strict level variance. */
export class StrictLevelVarianceValidator {
  rules: StrictLevelVarianceRule[];

  constructor(rules: StrictLevelVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: StrictLevelVariance): string[] {
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

  requireValid(item: StrictLevelVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictLevelVariance[]): Map<string, string[]> {
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

export function defaultStrictLevelVarianceValidator(): StrictLevelVarianceValidator {
  return new StrictLevelVarianceValidator(
    [
      new StrictLevelVarianceCodeLengthRule(3600),
      new StrictLevelVarianceAllowedCountryRule([]),
      new StrictLevelVarianceLabelLengthRule(32),
      new StrictLevelVarianceCodePrefixRule("REF"),
      new StrictLevelVarianceRequiredCountryRule("strict level variance needs this field"),
      new StrictLevelVarianceQuantityRangeRule(1000, 86400),
    ],
  );
}
