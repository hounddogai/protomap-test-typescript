import { TieredEscalationSummary } from "./tiered-escalation-summary.js";

/** A rule a tiered escalation summary must pass. Check returns its problems, or none. */
export interface TieredEscalationSummaryRule {
  check(item: TieredEscalationSummary): string[];
}

export class TieredEscalationSummaryRequiredCodeRule implements TieredEscalationSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredEscalationSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredEscalationSummaryCreatedAtRangeRule implements TieredEscalationSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredEscalationSummary): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredEscalationSummaryBudgetRangeRule implements TieredEscalationSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredEscalationSummary): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a tiered escalation summary. */
export class TieredEscalationSummaryValidator {
  rules: TieredEscalationSummaryRule[];

  constructor(rules: TieredEscalationSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: TieredEscalationSummary): string[] {
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

  requireValid(item: TieredEscalationSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredEscalationSummary[]): Map<string, string[]> {
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

export function defaultTieredEscalationSummaryValidator(): TieredEscalationSummaryValidator {
  return new TieredEscalationSummaryValidator(
    [
      new TieredEscalationSummaryRequiredCodeRule("tiered escalation summary needs an entry"),
      new TieredEscalationSummaryCreatedAtRangeRule(1000, 1000),
      new TieredEscalationSummaryBudgetRangeRule(10, 438.6),
    ],
  );
}
