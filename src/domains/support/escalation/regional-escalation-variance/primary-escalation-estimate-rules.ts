import { PrimaryEscalationEstimate } from "./primary-escalation-estimate.js";

/** A rule a primary escalation estimate must pass. Check returns its problems, or none. */
export interface PrimaryEscalationEstimateRule {
  check(item: PrimaryEscalationEstimate): string[];
}

export class PrimaryEscalationEstimateImpressionsRangeRule implements PrimaryEscalationEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryEscalationEstimate): string[] {
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

export class PrimaryEscalationEstimateRequiredTitleRule implements PrimaryEscalationEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryEscalationEstimate): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryEscalationEstimateRequiredCodeRule implements PrimaryEscalationEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryEscalationEstimate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryEscalationEstimateTitleLengthRule implements PrimaryEscalationEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryEscalationEstimate): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary escalation estimate. */
export class PrimaryEscalationEstimateValidator {
  rules: PrimaryEscalationEstimateRule[];

  constructor(rules: PrimaryEscalationEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryEscalationEstimate): string[] {
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

  requireValid(item: PrimaryEscalationEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryEscalationEstimate[]): Map<string, string[]> {
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

export function defaultPrimaryEscalationEstimateValidator(): PrimaryEscalationEstimateValidator {
  return new PrimaryEscalationEstimateValidator(
    [
      new PrimaryEscalationEstimateImpressionsRangeRule(64, 86400),
      new PrimaryEscalationEstimateRequiredTitleRule("primary escalation estimate needs a value"),
      new PrimaryEscalationEstimateRequiredCodeRule("primary escalation estimate needs a value"),
      new PrimaryEscalationEstimateTitleLengthRule(32),
    ],
  );
}
