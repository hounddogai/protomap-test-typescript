import * as text from "../../../../kit/text.js";
import { StrictCohortPlan } from "./strict-cohort-plan.js";

/** A rule a strict cohort plan must pass. Check returns its problems, or none. */
export interface StrictCohortPlanRule {
  check(item: StrictCohortPlan): string[];
}

export class StrictCohortPlanAllowedLocaleRule implements StrictCohortPlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictCohortPlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is expired`];
    return [];
  }
}

export class StrictCohortPlanRequiredCodeRule implements StrictCohortPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictCohortPlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictCohortPlanNameLengthRule implements StrictCohortPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictCohortPlan): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictCohortPlanRequiredLocaleRule implements StrictCohortPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictCohortPlan): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class StrictCohortPlanCodeLengthRule implements StrictCohortPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictCohortPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict cohort plan. */
export class StrictCohortPlanValidator {
  rules: StrictCohortPlanRule[];

  constructor(rules: StrictCohortPlanRule[]) {
    this.rules = rules;
  }

  validate(item: StrictCohortPlan): string[] {
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

  requireValid(item: StrictCohortPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictCohortPlan[]): Map<string, string[]> {
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

export function defaultStrictCohortPlanValidator(): StrictCohortPlanValidator {
  return new StrictCohortPlanValidator(
    [
      new StrictCohortPlanAllowedLocaleRule(["default", "manual", "scheduled"]),
      new StrictCohortPlanRequiredCodeRule("strict cohort plan needs this field"),
      new StrictCohortPlanNameLengthRule(16),
      new StrictCohortPlanRequiredLocaleRule("strict cohort plan needs this field"),
      new StrictCohortPlanCodeLengthRule(255),
    ],
  );
}
