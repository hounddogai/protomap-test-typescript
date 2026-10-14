import { FraudCheckMapping } from "./fraud-check-mapping.js";

/** A rule a fraud check mapping must pass. Check returns its problems, or none. */
export interface FraudCheckMappingRule {
  check(item: FraudCheckMapping): string[];
}

export class FraudCheckMappingLabelLengthRule implements FraudCheckMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckMapping): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckMappingLimitRangeRule implements FraudCheckMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FraudCheckMapping): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FraudCheckMappingCohortLengthRule implements FraudCheckMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckMapping): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckMappingCostRangeRule implements FraudCheckMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FraudCheckMapping): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FraudCheckMappingRateRangeRule implements FraudCheckMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FraudCheckMapping): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a fraud check mapping. */
export class FraudCheckMappingValidator {
  rules: FraudCheckMappingRule[];

  constructor(rules: FraudCheckMappingRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FraudCheckMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckMapping[]): Map<string, string[]> {
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

export function defaultFraudCheckMappingValidator(): FraudCheckMappingValidator {
  return new FraudCheckMappingValidator(
    [
      new FraudCheckMappingLabelLengthRule(255),
      new FraudCheckMappingLimitRangeRule(16, 80),
      new FraudCheckMappingCohortLengthRule(120),
      new FraudCheckMappingCostRangeRule(0.8, 3936),
      new FraudCheckMappingRateRangeRule(2.7, 3065.6),
    ],
  );
}
