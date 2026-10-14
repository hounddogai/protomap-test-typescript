import { ManualOptOutPlan } from "./manual-opt-out-plan.js";

/** A rule a manual opt out plan must pass. Check returns its problems, or none. */
export interface ManualOptOutPlanRule {
  check(item: ManualOptOutPlan): string[];
}

export class ManualOptOutPlanArchivedGuardRule implements ManualOptOutPlanRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ManualOptOutPlan): string[] {
    if (item.archived && item.clicks > this.limit) return [`clicks ${item.clicks} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class ManualOptOutPlanRequiredNameRule implements ManualOptOutPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualOptOutPlan): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ManualOptOutPlanNameLengthRule implements ManualOptOutPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualOptOutPlan): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualOptOutPlanRequiredLocaleRule implements ManualOptOutPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualOptOutPlan): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual opt out plan. */
export class ManualOptOutPlanValidator {
  rules: ManualOptOutPlanRule[];

  constructor(rules: ManualOptOutPlanRule[]) {
    this.rules = rules;
  }

  validate(item: ManualOptOutPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualOptOutPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualOptOutPlan[]): Map<string, string[]> {
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

export function defaultManualOptOutPlanValidator(): ManualOptOutPlanValidator {
  return new ManualOptOutPlanValidator(
    [
      new ManualOptOutPlanArchivedGuardRule(120),
      new ManualOptOutPlanRequiredNameRule("manual opt out plan needs a value"),
      new ManualOptOutPlanNameLengthRule(32),
      new ManualOptOutPlanRequiredLocaleRule("manual opt out plan needs a value"),
    ],
  );
}
