import { GlobalInsightGroup } from "./global-insight-group.js";

/** A rule a global insight group must pass. Check returns its problems, or none. */
export interface GlobalInsightGroupRule {
  check(item: GlobalInsightGroup): string[];
}

export class GlobalInsightGroupBudgetRangeRule implements GlobalInsightGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalInsightGroup): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalInsightGroupRequiredLabelRule implements GlobalInsightGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalInsightGroup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalInsightGroupCategoryLengthRule implements GlobalInsightGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalInsightGroup): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global insight group. */
export class GlobalInsightGroupValidator {
  rules: GlobalInsightGroupRule[];

  constructor(rules: GlobalInsightGroupRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalInsightGroup): string[] {
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

  requireValid(item: GlobalInsightGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalInsightGroup[]): Map<string, string[]> {
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

export function defaultGlobalInsightGroupValidator(): GlobalInsightGroupValidator {
  return new GlobalInsightGroupValidator(
    [
      new GlobalInsightGroupBudgetRangeRule(5.9, 714.9),
      new GlobalInsightGroupRequiredLabelRule("global insight group needs a value"),
      new GlobalInsightGroupCategoryLengthRule(16),
    ],
  );
}
