import { ReputationEstimate } from "./reputation-estimate.js";

/** A rule a reputation estimate must pass. Check returns its problems, or none. */
export interface ReputationEstimateRule {
  check(item: ReputationEstimate): string[];
}

export class ReputationEstimateBidRangeRule implements ReputationEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReputationEstimate): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ReputationEstimateCodeLengthRule implements ReputationEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationEstimate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReputationEstimateRequiredCodeRule implements ReputationEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationEstimate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reputation estimate. */
export class ReputationEstimateValidator {
  rules: ReputationEstimateRule[];

  constructor(rules: ReputationEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: ReputationEstimate): string[] {
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

  requireValid(item: ReputationEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReputationEstimate[]): Map<string, string[]> {
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

export function defaultReputationEstimateValidator(): ReputationEstimateValidator {
  return new ReputationEstimateValidator(
    [
      new ReputationEstimateBidRangeRule(7.7, 979.8),
      new ReputationEstimateCodeLengthRule(120),
      new ReputationEstimateRequiredCodeRule("reputation estimate needs an entry"),
    ],
  );
}
