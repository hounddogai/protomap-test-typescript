import { ModelPlan } from "./model-plan.js";

/** A rule a model plan must pass. Check returns its problems, or none. */
export interface ModelPlanRule {
  check(item: ModelPlan): string[];
}

export class ModelPlanTitleLengthRule implements ModelPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelPlan): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ModelPlanCodePrefixRule implements ModelPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ModelPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ModelPlanVisibleGuardRule implements ModelPlanRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ModelPlan): string[] {
    if (item.visible && item.budget > this.limit) return [`budget ${item.budget} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class ModelPlanOpenRateRangeRule implements ModelPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelPlan): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ModelPlanSourceLengthRule implements ModelPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelPlan): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a model plan. */
export class ModelPlanValidator {
  rules: ModelPlanRule[];

  constructor(rules: ModelPlanRule[]) {
    this.rules = rules;
  }

  validate(item: ModelPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ModelPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelPlan[]): Map<string, string[]> {
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

export function defaultModelPlanValidator(): ModelPlanValidator {
  return new ModelPlanValidator(
    [
      new ModelPlanTitleLengthRule(1000),
      new ModelPlanCodePrefixRule("REF"),
      new ModelPlanVisibleGuardRule(1.3),
      new ModelPlanOpenRateRangeRule(0.1, 3450.1),
      new ModelPlanSourceLengthRule(1000),
    ],
  );
}
