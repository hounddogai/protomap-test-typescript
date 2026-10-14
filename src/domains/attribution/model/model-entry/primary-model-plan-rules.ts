import { PrimaryModelPlan } from "./primary-model-plan.js";

/** A rule a primary model plan must pass. Check returns its problems, or none. */
export interface PrimaryModelPlanRule {
  check(item: PrimaryModelPlan): string[];
}

export class PrimaryModelPlanRequiredCategoryRule implements PrimaryModelPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryModelPlan): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryModelPlanLabelLengthRule implements PrimaryModelPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryModelPlan): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryModelPlanCodeLengthRule implements PrimaryModelPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryModelPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary model plan. */
export class PrimaryModelPlanValidator {
  rules: PrimaryModelPlanRule[];

  constructor(rules: PrimaryModelPlanRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryModelPlan): string[] {
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

  requireValid(item: PrimaryModelPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryModelPlan[]): Map<string, string[]> {
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

export function defaultPrimaryModelPlanValidator(): PrimaryModelPlanValidator {
  return new PrimaryModelPlanValidator(
    [
      new PrimaryModelPlanRequiredCategoryRule("primary model plan needs a value"),
      new PrimaryModelPlanLabelLengthRule(64),
      new PrimaryModelPlanCodeLengthRule(64),
    ],
  );
}
