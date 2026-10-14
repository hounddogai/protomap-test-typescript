import { DoubleOptInPlan } from "./double-opt-in-plan.js";

/** A rule a double opt in plan must pass. Check returns its problems, or none. */
export interface DoubleOptInPlanRule {
  check(item: DoubleOptInPlan): string[];
}

export class DoubleOptInPlanMaximumRangeRule implements DoubleOptInPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInPlan): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DoubleOptInPlanCodeLengthRule implements DoubleOptInPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DoubleOptInPlanRequiredCodeRule implements DoubleOptInPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInPlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DoubleOptInPlanCapacityRangeRule implements DoubleOptInPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInPlan): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DoubleOptInPlanCodePrefixRule implements DoubleOptInPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DoubleOptInPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DoubleOptInPlanRequiredLabelRule implements DoubleOptInPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInPlan): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a double opt in plan. */
export class DoubleOptInPlanValidator {
  rules: DoubleOptInPlanRule[];

  constructor(rules: DoubleOptInPlanRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInPlan): string[] {
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

  requireValid(item: DoubleOptInPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInPlan[]): Map<string, string[]> {
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

export function defaultDoubleOptInPlanValidator(): DoubleOptInPlanValidator {
  return new DoubleOptInPlanValidator(
    [
      new DoubleOptInPlanMaximumRangeRule(4.9, 3445.5),
      new DoubleOptInPlanCodeLengthRule(1000),
      new DoubleOptInPlanRequiredCodeRule("double opt in plan needs a value"),
      new DoubleOptInPlanCapacityRangeRule(80, 1000),
      new DoubleOptInPlanCodePrefixRule("Q"),
      new DoubleOptInPlanRequiredLabelRule("double opt in plan needs an entry"),
    ],
  );
}
