import { PlacementPolicy } from "./placement-policy.js";

/** A rule a placement policy must pass. Check returns its problems, or none. */
export interface PlacementPolicyRule {
  check(item: PlacementPolicy): string[];
}

export class PlacementPolicyConversionRateRangeRule implements PlacementPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementPolicy): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PlacementPolicyTitleLengthRule implements PlacementPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementPolicy): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementPolicyRequiredReviewerRule implements PlacementPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementPolicy): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a placement policy. */
export class PlacementPolicyValidator {
  rules: PlacementPolicyRule[];

  constructor(rules: PlacementPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PlacementPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementPolicy[]): Map<string, string[]> {
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

export function defaultPlacementPolicyValidator(): PlacementPolicyValidator {
  return new PlacementPolicyValidator(
    [
      new PlacementPolicyConversionRateRangeRule(3.1, 1126),
      new PlacementPolicyTitleLengthRule(86400),
      new PlacementPolicyRequiredReviewerRule("placement policy needs this field"),
    ],
  );
}
