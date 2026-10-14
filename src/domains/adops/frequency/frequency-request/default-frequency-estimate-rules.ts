import * as text from "../../../../kit/text.js";
import { DefaultFrequencyEstimate } from "./default-frequency-estimate.js";

/** A rule a default frequency estimate must pass. Check returns its problems, or none. */
export interface DefaultFrequencyEstimateRule {
  check(item: DefaultFrequencyEstimate): string[];
}

export class DefaultFrequencyEstimateCodePrefixRule implements DefaultFrequencyEstimateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultFrequencyEstimate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultFrequencyEstimateAllowedNameRule implements DefaultFrequencyEstimateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultFrequencyEstimate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is inconsistent`];
    return [];
  }
}

export class DefaultFrequencyEstimateNameLengthRule implements DefaultFrequencyEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultFrequencyEstimate): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultFrequencyEstimateRequiredCodeRule implements DefaultFrequencyEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultFrequencyEstimate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultFrequencyEstimateRequiredNameRule implements DefaultFrequencyEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultFrequencyEstimate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultFrequencyEstimateBidRangeRule implements DefaultFrequencyEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultFrequencyEstimate): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a default frequency estimate. */
export class DefaultFrequencyEstimateValidator {
  rules: DefaultFrequencyEstimateRule[];

  constructor(rules: DefaultFrequencyEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultFrequencyEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultFrequencyEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultFrequencyEstimate[]): Map<string, string[]> {
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

export function defaultDefaultFrequencyEstimateValidator(): DefaultFrequencyEstimateValidator {
  return new DefaultFrequencyEstimateValidator(
    [
      new DefaultFrequencyEstimateCodePrefixRule("OPS"),
      new DefaultFrequencyEstimateAllowedNameRule(["scheduled", "pending"]),
      new DefaultFrequencyEstimateNameLengthRule(255),
      new DefaultFrequencyEstimateRequiredCodeRule("default frequency estimate needs an entry"),
      new DefaultFrequencyEstimateRequiredNameRule("default frequency estimate needs an entry"),
      new DefaultFrequencyEstimateBidRangeRule(1.7, 1881.5),
    ],
  );
}
