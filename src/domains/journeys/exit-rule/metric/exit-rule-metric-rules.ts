import { ExitRuleMetric } from "./exit-rule-metric.js";

/** A rule a exit rule metric must pass. Check returns its problems, or none. */
export interface ExitRuleMetricRule {
  check(item: ExitRuleMetric): string[];
}

export class ExitRuleMetricRequiredOwnerIdRule implements ExitRuleMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleMetric): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRuleMetricRequiredCodeRule implements ExitRuleMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleMetric): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRuleMetricLabelLengthRule implements ExitRuleMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleMetric): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a exit rule metric. */
export class ExitRuleMetricValidator {
  rules: ExitRuleMetricRule[];

  constructor(rules: ExitRuleMetricRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ExitRuleMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleMetric[]): Map<string, string[]> {
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

export function defaultExitRuleMetricValidator(): ExitRuleMetricValidator {
  return new ExitRuleMetricValidator(
    [
      new ExitRuleMetricRequiredOwnerIdRule("exit rule metric needs an entry"),
      new ExitRuleMetricRequiredCodeRule("exit rule metric needs an entry"),
      new ExitRuleMetricLabelLengthRule(64),
    ],
  );
}
