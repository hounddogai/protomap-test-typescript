import { TieredDoubleOptInPlan } from "./tiered-double-opt-in-plan.js";

/** A rule a tiered double opt in plan must pass. Check returns its problems, or none. */
export interface TieredDoubleOptInPlanRule {
  check(item: TieredDoubleOptInPlan): string[];
}

export class TieredDoubleOptInPlanLabelLengthRule implements TieredDoubleOptInPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredDoubleOptInPlan): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredDoubleOptInPlanCodeLengthRule implements TieredDoubleOptInPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredDoubleOptInPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredDoubleOptInPlanVersionRangeRule implements TieredDoubleOptInPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredDoubleOptInPlan): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredDoubleOptInPlanRequiredCategoryRule implements TieredDoubleOptInPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredDoubleOptInPlan): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class TieredDoubleOptInPlanSendAtRangeRule implements TieredDoubleOptInPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredDoubleOptInPlan): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a tiered double opt in plan. */
export class TieredDoubleOptInPlanValidator {
  rules: TieredDoubleOptInPlanRule[];

  constructor(rules: TieredDoubleOptInPlanRule[]) {
    this.rules = rules;
  }

  validate(item: TieredDoubleOptInPlan): string[] {
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

  requireValid(item: TieredDoubleOptInPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredDoubleOptInPlan[]): Map<string, string[]> {
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

export function defaultTieredDoubleOptInPlanValidator(): TieredDoubleOptInPlanValidator {
  return new TieredDoubleOptInPlanValidator(
    [
      new TieredDoubleOptInPlanLabelLengthRule(64),
      new TieredDoubleOptInPlanCodeLengthRule(3600),
      new TieredDoubleOptInPlanVersionRangeRule(120, 86400),
      new TieredDoubleOptInPlanRequiredCategoryRule("tiered double opt in plan needs an entry"),
      new TieredDoubleOptInPlanSendAtRangeRule(3600, 86400),
    ],
  );
}
