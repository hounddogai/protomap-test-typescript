import { ActivationClaim } from "./activation-claim.js";

/** A rule a activation claim must pass. Check returns its problems, or none. */
export interface ActivationClaimRule {
  check(item: ActivationClaim): string[];
}

export class ActivationClaimCategoryLengthRule implements ActivationClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationClaim): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationClaimWeightRangeRule implements ActivationClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationClaim): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ActivationClaimUnitLengthRule implements ActivationClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationClaim): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationClaimAmountRangeRule implements ActivationClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationClaim): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a activation claim. */
export class ActivationClaimValidator {
  rules: ActivationClaimRule[];

  constructor(rules: ActivationClaimRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationClaim): string[] {
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

  requireValid(item: ActivationClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationClaim[]): Map<string, string[]> {
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

export function defaultActivationClaimValidator(): ActivationClaimValidator {
  return new ActivationClaimValidator(
    [
      new ActivationClaimCategoryLengthRule(80),
      new ActivationClaimWeightRangeRule(8.4, 3385),
      new ActivationClaimUnitLengthRule(86400),
      new ActivationClaimAmountRangeRule(9.1, 1210.7),
    ],
  );
}
