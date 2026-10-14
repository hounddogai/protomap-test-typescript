import { InsightRule } from "./insight-rule.js";

/** A rule a insight rule must pass. Check returns its problems, or none. */
export interface InsightRuleRule {
  check(item: InsightRule): string[];
}

export class InsightRulePriorityRangeRule implements InsightRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightRule): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class InsightRuleRequiredLocaleRule implements InsightRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightRule): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class InsightRuleDescriptionLengthRule implements InsightRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightRule): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightRuleNameLengthRule implements InsightRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightRule): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a insight rule. */
export class InsightRuleValidator {
  rules: InsightRuleRule[];

  constructor(rules: InsightRuleRule[]) {
    this.rules = rules;
  }

  validate(item: InsightRule): string[] {
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

  requireValid(item: InsightRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightRule[]): Map<string, string[]> {
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

export function defaultInsightRuleValidator(): InsightRuleValidator {
  return new InsightRuleValidator(
    [
      new InsightRulePriorityRangeRule(3600, 86400),
      new InsightRuleRequiredLocaleRule("insight rule needs a value"),
      new InsightRuleDescriptionLengthRule(80),
      new InsightRuleNameLengthRule(1000),
    ],
  );
}
