import { LenientSuppressionPlan } from "./lenient-suppression-plan.js";

/** A rule a lenient suppression plan must pass. Check returns its problems, or none. */
export interface LenientSuppressionPlanRule {
  check(item: LenientSuppressionPlan): string[];
}

export class LenientSuppressionPlanCodePrefixRule implements LenientSuppressionPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientSuppressionPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientSuppressionPlanRequiredSourceRule implements LenientSuppressionPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientSuppressionPlan): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class LenientSuppressionPlanCodeLengthRule implements LenientSuppressionPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientSuppressionPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientSuppressionPlanDiscountRangeRule implements LenientSuppressionPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientSuppressionPlan): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a lenient suppression plan. */
export class LenientSuppressionPlanValidator {
  rules: LenientSuppressionPlanRule[];

  constructor(rules: LenientSuppressionPlanRule[]) {
    this.rules = rules;
  }

  validate(item: LenientSuppressionPlan): string[] {
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

  requireValid(item: LenientSuppressionPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientSuppressionPlan[]): Map<string, string[]> {
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

export function defaultLenientSuppressionPlanValidator(): LenientSuppressionPlanValidator {
  return new LenientSuppressionPlanValidator(
    [
      new LenientSuppressionPlanCodePrefixRule("ACM"),
      new LenientSuppressionPlanRequiredSourceRule("lenient suppression plan needs this field"),
      new LenientSuppressionPlanCodeLengthRule(32),
      new LenientSuppressionPlanDiscountRangeRule(3.5, 4219.7),
    ],
  );
}
