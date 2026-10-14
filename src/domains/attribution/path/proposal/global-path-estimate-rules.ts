import { GlobalPathEstimate } from "./global-path-estimate.js";

/** A rule a global path estimate must pass. Check returns its problems, or none. */
export interface GlobalPathEstimateRule {
  check(item: GlobalPathEstimate): string[];
}

export class GlobalPathEstimateCodeLengthRule implements GlobalPathEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalPathEstimate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalPathEstimateTitleLengthRule implements GlobalPathEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalPathEstimate): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalPathEstimateCostRangeRule implements GlobalPathEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalPathEstimate): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalPathEstimateCodePrefixRule implements GlobalPathEstimateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalPathEstimate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a global path estimate. */
export class GlobalPathEstimateValidator {
  rules: GlobalPathEstimateRule[];

  constructor(rules: GlobalPathEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalPathEstimate): string[] {
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

  requireValid(item: GlobalPathEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalPathEstimate[]): Map<string, string[]> {
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

export function defaultGlobalPathEstimateValidator(): GlobalPathEstimateValidator {
  return new GlobalPathEstimateValidator(
    [
      new GlobalPathEstimateCodeLengthRule(80),
      new GlobalPathEstimateTitleLengthRule(16),
      new GlobalPathEstimateCostRangeRule(7.9, 4605.1),
      new GlobalPathEstimateCodePrefixRule("ACM"),
    ],
  );
}
