import { ModelClaim } from "./model-claim.js";

/** A rule a model claim must pass. Check returns its problems, or none. */
export interface ModelClaimRule {
  check(item: ModelClaim): string[];
}

export class ModelClaimCodePrefixRule implements ModelClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ModelClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ModelClaimGraceDaysRangeRule implements ModelClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelClaim): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ModelClaimCodeLengthRule implements ModelClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelClaim): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ModelClaimNameLengthRule implements ModelClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelClaim): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a model claim. */
export class ModelClaimValidator {
  rules: ModelClaimRule[];

  constructor(rules: ModelClaimRule[]) {
    this.rules = rules;
  }

  validate(item: ModelClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ModelClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelClaim[]): Map<string, string[]> {
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

export function defaultModelClaimValidator(): ModelClaimValidator {
  return new ModelClaimValidator(
    [
      new ModelClaimCodePrefixRule("ACM"),
      new ModelClaimGraceDaysRangeRule(64, 1000),
      new ModelClaimCodeLengthRule(86400),
      new ModelClaimNameLengthRule(32),
    ],
  );
}
