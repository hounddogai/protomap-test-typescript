import { DefaultFraudCheckPlan } from "./default-fraud-check-plan.js";

/** A rule a default fraud check plan must pass. Check returns its problems, or none. */
export interface DefaultFraudCheckPlanRule {
  check(item: DefaultFraudCheckPlan): string[];
}

export class DefaultFraudCheckPlanRequiredCodeRule implements DefaultFraudCheckPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultFraudCheckPlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultFraudCheckPlanCodeLengthRule implements DefaultFraudCheckPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultFraudCheckPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultFraudCheckPlanRequiredTitleRule implements DefaultFraudCheckPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultFraudCheckPlan): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultFraudCheckPlanRequiredNameRule implements DefaultFraudCheckPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultFraudCheckPlan): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default fraud check plan. */
export class DefaultFraudCheckPlanValidator {
  rules: DefaultFraudCheckPlanRule[];

  constructor(rules: DefaultFraudCheckPlanRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultFraudCheckPlan): string[] {
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

  requireValid(item: DefaultFraudCheckPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultFraudCheckPlan[]): Map<string, string[]> {
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

export function defaultDefaultFraudCheckPlanValidator(): DefaultFraudCheckPlanValidator {
  return new DefaultFraudCheckPlanValidator(
    [
      new DefaultFraudCheckPlanRequiredCodeRule("default fraud check plan needs a value"),
      new DefaultFraudCheckPlanCodeLengthRule(3600),
      new DefaultFraudCheckPlanRequiredTitleRule("default fraud check plan needs this field"),
      new DefaultFraudCheckPlanRequiredNameRule("default fraud check plan needs this field"),
    ],
  );
}
