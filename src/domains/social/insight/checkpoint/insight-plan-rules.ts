import { InsightPlan } from "./insight-plan.js";

/** A rule a insight plan must pass. Check returns its problems, or none. */
export interface InsightPlanRule {
  check(item: InsightPlan): string[];
}

export class InsightPlanWeightRangeRule implements InsightPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightPlan): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class InsightPlanCodePrefixRule implements InsightPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: InsightPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class InsightPlanSourceLengthRule implements InsightPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightPlan): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightPlanCodeLengthRule implements InsightPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightPlanRequiredSourceRule implements InsightPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightPlan): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a insight plan. */
export class InsightPlanValidator {
  rules: InsightPlanRule[];

  constructor(rules: InsightPlanRule[]) {
    this.rules = rules;
  }

  validate(item: InsightPlan): string[] {
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

  requireValid(item: InsightPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightPlan[]): Map<string, string[]> {
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

export function defaultInsightPlanValidator(): InsightPlanValidator {
  return new InsightPlanValidator(
    [
      new InsightPlanWeightRangeRule(6.1, 1876.9),
      new InsightPlanCodePrefixRule("X"),
      new InsightPlanSourceLengthRule(255),
      new InsightPlanCodeLengthRule(1000),
      new InsightPlanRequiredSourceRule("insight plan needs this field"),
    ],
  );
}
