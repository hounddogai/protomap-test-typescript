import { CohortPlan } from "./cohort-plan.js";

/** A rule a cohort plan must pass. Check returns its problems, or none. */
export interface CohortPlanRule {
  check(item: CohortPlan): string[];
}

export class CohortPlanCodeLengthRule implements CohortPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortPlanSourceLengthRule implements CohortPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortPlan): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortPlanRequiredNameRule implements CohortPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortPlan): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CohortPlanCodePrefixRule implements CohortPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CohortPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a cohort plan. */
export class CohortPlanValidator {
  rules: CohortPlanRule[];

  constructor(rules: CohortPlanRule[]) {
    this.rules = rules;
  }

  validate(item: CohortPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CohortPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortPlan[]): Map<string, string[]> {
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

export function defaultCohortPlanValidator(): CohortPlanValidator {
  return new CohortPlanValidator(
    [
      new CohortPlanCodeLengthRule(3600),
      new CohortPlanSourceLengthRule(16),
      new CohortPlanRequiredNameRule("cohort plan needs this field"),
      new CohortPlanCodePrefixRule("OPS"),
    ],
  );
}
