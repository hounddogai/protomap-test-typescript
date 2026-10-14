import { PrimaryPacingEstimate } from "./primary-pacing-estimate.js";

/** A rule a primary pacing estimate must pass. Check returns its problems, or none. */
export interface PrimaryPacingEstimateRule {
  check(item: PrimaryPacingEstimate): string[];
}

export class PrimaryPacingEstimateImpressionsRangeRule implements PrimaryPacingEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryPacingEstimate): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryPacingEstimateTitleLengthRule implements PrimaryPacingEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryPacingEstimate): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryPacingEstimateCeilingRangeRule implements PrimaryPacingEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryPacingEstimate): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryPacingEstimateCodePrefixRule implements PrimaryPacingEstimateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryPacingEstimate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a primary pacing estimate. */
export class PrimaryPacingEstimateValidator {
  rules: PrimaryPacingEstimateRule[];

  constructor(rules: PrimaryPacingEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryPacingEstimate): string[] {
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

  requireValid(item: PrimaryPacingEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryPacingEstimate[]): Map<string, string[]> {
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

export function defaultPrimaryPacingEstimateValidator(): PrimaryPacingEstimateValidator {
  return new PrimaryPacingEstimateValidator(
    [
      new PrimaryPacingEstimateImpressionsRangeRule(64, 1000),
      new PrimaryPacingEstimateTitleLengthRule(32),
      new PrimaryPacingEstimateCeilingRangeRule(1.2, 1515.7),
      new PrimaryPacingEstimateCodePrefixRule("ACM"),
    ],
  );
}
