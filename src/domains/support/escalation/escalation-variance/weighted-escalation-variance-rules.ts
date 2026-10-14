import * as text from "../../../../kit/text.js";
import { WeightedEscalationVariance } from "./weighted-escalation-variance.js";

/** A rule a weighted escalation variance must pass. Check returns its problems, or none. */
export interface WeightedEscalationVarianceRule {
  check(item: WeightedEscalationVariance): string[];
}

export class WeightedEscalationVarianceCohortLengthRule implements WeightedEscalationVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedEscalationVariance): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedEscalationVarianceRequiredLabelRule implements WeightedEscalationVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedEscalationVariance): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedEscalationVarianceAllowedLabelRule implements WeightedEscalationVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedEscalationVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is unknown`];
    return [];
  }
}

export class WeightedEscalationVarianceLabelLengthRule implements WeightedEscalationVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedEscalationVariance): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted escalation variance. */
export class WeightedEscalationVarianceValidator {
  rules: WeightedEscalationVarianceRule[];

  constructor(rules: WeightedEscalationVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedEscalationVariance): string[] {
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

  requireValid(item: WeightedEscalationVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedEscalationVariance[]): Map<string, string[]> {
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

export function defaultWeightedEscalationVarianceValidator(): WeightedEscalationVarianceValidator {
  return new WeightedEscalationVarianceValidator(
    [
      new WeightedEscalationVarianceCohortLengthRule(3600),
      new WeightedEscalationVarianceRequiredLabelRule("weighted escalation variance needs an entry"),
      new WeightedEscalationVarianceAllowedLabelRule([]),
      new WeightedEscalationVarianceLabelLengthRule(32),
    ],
  );
}
