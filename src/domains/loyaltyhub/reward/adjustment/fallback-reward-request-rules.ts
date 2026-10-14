import { FallbackRewardRequest } from "./fallback-reward-request.js";

/** A rule a fallback reward request must pass. Check returns its problems, or none. */
export interface FallbackRewardRequestRule {
  check(item: FallbackRewardRequest): string[];
}

export class FallbackRewardRequestThresholdRangeRule implements FallbackRewardRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackRewardRequest): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackRewardRequestRequiredLabelRule implements FallbackRewardRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackRewardRequest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackRewardRequestLabelLengthRule implements FallbackRewardRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackRewardRequest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback reward request. */
export class FallbackRewardRequestValidator {
  rules: FallbackRewardRequestRule[];

  constructor(rules: FallbackRewardRequestRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackRewardRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackRewardRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackRewardRequest[]): Map<string, string[]> {
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

export function defaultFallbackRewardRequestValidator(): FallbackRewardRequestValidator {
  return new FallbackRewardRequestValidator(
    [
      new FallbackRewardRequestThresholdRangeRule(6.4, 2816.1),
      new FallbackRewardRequestRequiredLabelRule("fallback reward request needs this field"),
      new FallbackRewardRequestLabelLengthRule(16),
    ],
  );
}
