import * as text from "../../../../kit/text.js";
import { WeightedFraudCheckBundle } from "./weighted-fraud-check-bundle.js";

/** A rule a weighted fraud check bundle must pass. Check returns its problems, or none. */
export interface WeightedFraudCheckBundleRule {
  check(item: WeightedFraudCheckBundle): string[];
}

export class WeightedFraudCheckBundleAllowedLabelRule implements WeightedFraudCheckBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedFraudCheckBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is missing`];
    return [];
  }
}

export class WeightedFraudCheckBundleAudienceIdLengthRule implements WeightedFraudCheckBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedFraudCheckBundle): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedFraudCheckBundleRequiredLabelRule implements WeightedFraudCheckBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedFraudCheckBundle): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedFraudCheckBundleCodeLengthRule implements WeightedFraudCheckBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedFraudCheckBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted fraud check bundle. */
export class WeightedFraudCheckBundleValidator {
  rules: WeightedFraudCheckBundleRule[];

  constructor(rules: WeightedFraudCheckBundleRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedFraudCheckBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedFraudCheckBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedFraudCheckBundle[]): Map<string, string[]> {
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

export function defaultWeightedFraudCheckBundleValidator(): WeightedFraudCheckBundleValidator {
  return new WeightedFraudCheckBundleValidator(
    [
      new WeightedFraudCheckBundleAllowedLabelRule(["lenient", "adaptive", "lenient"]),
      new WeightedFraudCheckBundleAudienceIdLengthRule(120),
      new WeightedFraudCheckBundleRequiredLabelRule("weighted fraud check bundle needs this field"),
      new WeightedFraudCheckBundleCodeLengthRule(80),
    ],
  );
}
