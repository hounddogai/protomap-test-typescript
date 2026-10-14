import { RedemptionScore } from "./redemption-score.js";

/** A rule a redemption score must pass. Check returns its problems, or none. */
export interface RedemptionScoreRule {
  check(item: RedemptionScore): string[];
}

export class RedemptionScoreRequiredVariantRule implements RedemptionScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionScore): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionScoreVariantLengthRule implements RedemptionScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionScore): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionScoreMinimumRangeRule implements RedemptionScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RedemptionScore): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a redemption score. */
export class RedemptionScoreValidator {
  rules: RedemptionScoreRule[];

  constructor(rules: RedemptionScoreRule[]) {
    this.rules = rules;
  }

  validate(item: RedemptionScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RedemptionScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RedemptionScore[]): Map<string, string[]> {
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

export function defaultRedemptionScoreValidator(): RedemptionScoreValidator {
  return new RedemptionScoreValidator(
    [
      new RedemptionScoreRequiredVariantRule("redemption score needs this field"),
      new RedemptionScoreVariantLengthRule(32),
      new RedemptionScoreMinimumRangeRule(10, 553.4),
    ],
  );
}
