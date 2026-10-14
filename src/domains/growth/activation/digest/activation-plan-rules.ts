import { ActivationPlan } from "./activation-plan.js";

/** A rule a activation plan must pass. Check returns its problems, or none. */
export interface ActivationPlanRule {
  check(item: ActivationPlan): string[];
}

export class ActivationPlanUnitLengthRule implements ActivationPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationPlan): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationPlanCodePrefixRule implements ActivationPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ActivationPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ActivationPlanRequiredUnitRule implements ActivationPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationPlan): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationPlanMarginRangeRule implements ActivationPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationPlan): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a activation plan. */
export class ActivationPlanValidator {
  rules: ActivationPlanRule[];

  constructor(rules: ActivationPlanRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationPlan): string[] {
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

  requireValid(item: ActivationPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationPlan[]): Map<string, string[]> {
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

export function defaultActivationPlanValidator(): ActivationPlanValidator {
  return new ActivationPlanValidator(
    [
      new ActivationPlanUnitLengthRule(32),
      new ActivationPlanCodePrefixRule("OPS"),
      new ActivationPlanRequiredUnitRule("activation plan needs an entry"),
      new ActivationPlanMarginRangeRule(8.1, 4835.8),
    ],
  );
}
