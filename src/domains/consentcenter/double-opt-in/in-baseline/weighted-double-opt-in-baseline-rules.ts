import * as text from "../../../../kit/text.js";
import { WeightedDoubleOptInBaseline } from "./weighted-double-opt-in-baseline.js";

/** A rule a weighted double opt in baseline must pass. Check returns its problems, or none. */
export interface WeightedDoubleOptInBaselineRule {
  check(item: WeightedDoubleOptInBaseline): string[];
}

export class WeightedDoubleOptInBaselineRequiredCodeRule implements WeightedDoubleOptInBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedDoubleOptInBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedDoubleOptInBaselineRequiredNameRule implements WeightedDoubleOptInBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedDoubleOptInBaseline): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedDoubleOptInBaselineNameLengthRule implements WeightedDoubleOptInBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedDoubleOptInBaseline): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedDoubleOptInBaselineAllowedCodeRule implements WeightedDoubleOptInBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedDoubleOptInBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class WeightedDoubleOptInBaselineCodePrefixRule implements WeightedDoubleOptInBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedDoubleOptInBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a weighted double opt in baseline. */
export class WeightedDoubleOptInBaselineValidator {
  rules: WeightedDoubleOptInBaselineRule[];

  constructor(rules: WeightedDoubleOptInBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedDoubleOptInBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedDoubleOptInBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedDoubleOptInBaseline[]): Map<string, string[]> {
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

export function defaultWeightedDoubleOptInBaselineValidator(): WeightedDoubleOptInBaselineValidator {
  return new WeightedDoubleOptInBaselineValidator(
    [
      new WeightedDoubleOptInBaselineRequiredCodeRule("weighted double opt in baseline needs this field"),
      new WeightedDoubleOptInBaselineRequiredNameRule("weighted double opt in baseline needs an entry"),
      new WeightedDoubleOptInBaselineNameLengthRule(3600),
      new WeightedDoubleOptInBaselineAllowedCodeRule(["fallback"]),
      new WeightedDoubleOptInBaselineCodePrefixRule("ACM"),
    ],
  );
}
