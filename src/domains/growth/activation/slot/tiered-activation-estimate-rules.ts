import { TieredActivationEstimate } from "./tiered-activation-estimate.js";

/** A rule a tiered activation estimate must pass. Check returns its problems, or none. */
export interface TieredActivationEstimateRule {
  check(item: TieredActivationEstimate): string[];
}

export class TieredActivationEstimateCodePrefixRule implements TieredActivationEstimateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredActivationEstimate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredActivationEstimateCodeLengthRule implements TieredActivationEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredActivationEstimate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredActivationEstimateRequiredNameRule implements TieredActivationEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredActivationEstimate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TieredActivationEstimateRequiredCodeRule implements TieredActivationEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredActivationEstimate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredActivationEstimateNameLengthRule implements TieredActivationEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredActivationEstimate): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredActivationEstimateBidRangeRule implements TieredActivationEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredActivationEstimate): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a tiered activation estimate. */
export class TieredActivationEstimateValidator {
  rules: TieredActivationEstimateRule[];

  constructor(rules: TieredActivationEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: TieredActivationEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredActivationEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredActivationEstimate[]): Map<string, string[]> {
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

export function defaultTieredActivationEstimateValidator(): TieredActivationEstimateValidator {
  return new TieredActivationEstimateValidator(
    [
      new TieredActivationEstimateCodePrefixRule("OPS"),
      new TieredActivationEstimateCodeLengthRule(86400),
      new TieredActivationEstimateRequiredNameRule("tiered activation estimate needs this field"),
      new TieredActivationEstimateRequiredCodeRule("tiered activation estimate needs a value"),
      new TieredActivationEstimateNameLengthRule(120),
      new TieredActivationEstimateBidRangeRule(1.8, 1534.8),
    ],
  );
}
