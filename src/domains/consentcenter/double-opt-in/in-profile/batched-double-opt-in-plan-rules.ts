import * as text from "../../../../kit/text.js";
import { BatchedDoubleOptInPlan } from "./batched-double-opt-in-plan.js";

/** A rule a batched double opt in plan must pass. Check returns its problems, or none. */
export interface BatchedDoubleOptInPlanRule {
  check(item: BatchedDoubleOptInPlan): string[];
}

export class BatchedDoubleOptInPlanRequiredNameRule implements BatchedDoubleOptInPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedDoubleOptInPlan): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedDoubleOptInPlanAllowedNameRule implements BatchedDoubleOptInPlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedDoubleOptInPlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is below minimum`];
    return [];
  }
}

export class BatchedDoubleOptInPlanConversionRateRangeRule implements BatchedDoubleOptInPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedDoubleOptInPlan): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedDoubleOptInPlanRequiredCodeRule implements BatchedDoubleOptInPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedDoubleOptInPlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedDoubleOptInPlanRequiredSegmentRule implements BatchedDoubleOptInPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedDoubleOptInPlan): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedDoubleOptInPlanCodePrefixRule implements BatchedDoubleOptInPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedDoubleOptInPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a batched double opt in plan. */
export class BatchedDoubleOptInPlanValidator {
  rules: BatchedDoubleOptInPlanRule[];

  constructor(rules: BatchedDoubleOptInPlanRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedDoubleOptInPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedDoubleOptInPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedDoubleOptInPlan[]): Map<string, string[]> {
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

export function defaultBatchedDoubleOptInPlanValidator(): BatchedDoubleOptInPlanValidator {
  return new BatchedDoubleOptInPlanValidator(
    [
      new BatchedDoubleOptInPlanRequiredNameRule("batched double opt in plan needs an entry"),
      new BatchedDoubleOptInPlanAllowedNameRule([]),
      new BatchedDoubleOptInPlanConversionRateRangeRule(6.2, 4397.5),
      new BatchedDoubleOptInPlanRequiredCodeRule("batched double opt in plan needs this field"),
      new BatchedDoubleOptInPlanRequiredSegmentRule("batched double opt in plan needs an entry"),
      new BatchedDoubleOptInPlanCodePrefixRule("X"),
    ],
  );
}
