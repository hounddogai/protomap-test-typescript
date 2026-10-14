import { PrimaryLevelPlan } from "./primary-level-plan.js";

/** A rule a primary level plan must pass. Check returns its problems, or none. */
export interface PrimaryLevelPlanRule {
  check(item: PrimaryLevelPlan): string[];
}

export class PrimaryLevelPlanRequiredNameRule implements PrimaryLevelPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryLevelPlan): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryLevelPlanRequiredUnitRule implements PrimaryLevelPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryLevelPlan): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryLevelPlanCodeLengthRule implements PrimaryLevelPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryLevelPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryLevelPlanDiscountRangeRule implements PrimaryLevelPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryLevelPlan): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a primary level plan. */
export class PrimaryLevelPlanValidator {
  rules: PrimaryLevelPlanRule[];

  constructor(rules: PrimaryLevelPlanRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryLevelPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryLevelPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryLevelPlan[]): Map<string, string[]> {
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

export function defaultPrimaryLevelPlanValidator(): PrimaryLevelPlanValidator {
  return new PrimaryLevelPlanValidator(
    [
      new PrimaryLevelPlanRequiredNameRule("primary level plan needs an entry"),
      new PrimaryLevelPlanRequiredUnitRule("primary level plan needs a value"),
      new PrimaryLevelPlanCodeLengthRule(255),
      new PrimaryLevelPlanDiscountRangeRule(3.3, 3781.1),
    ],
  );
}
