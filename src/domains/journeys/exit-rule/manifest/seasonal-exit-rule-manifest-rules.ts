import { SeasonalExitRuleManifest } from "./seasonal-exit-rule-manifest.js";

/** A rule a seasonal exit rule manifest must pass. Check returns its problems, or none. */
export interface SeasonalExitRuleManifestRule {
  check(item: SeasonalExitRuleManifest): string[];
}

export class SeasonalExitRuleManifestCodeLengthRule implements SeasonalExitRuleManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalExitRuleManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalExitRuleManifestTitleLengthRule implements SeasonalExitRuleManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalExitRuleManifest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalExitRuleManifestBudgetRangeRule implements SeasonalExitRuleManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalExitRuleManifest): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalExitRuleManifestRequiredSummaryRule implements SeasonalExitRuleManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalExitRuleManifest): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalExitRuleManifestRequiredTitleRule implements SeasonalExitRuleManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalExitRuleManifest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal exit rule manifest. */
export class SeasonalExitRuleManifestValidator {
  rules: SeasonalExitRuleManifestRule[];

  constructor(rules: SeasonalExitRuleManifestRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalExitRuleManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalExitRuleManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalExitRuleManifest[]): Map<string, string[]> {
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

export function defaultSeasonalExitRuleManifestValidator(): SeasonalExitRuleManifestValidator {
  return new SeasonalExitRuleManifestValidator(
    [
      new SeasonalExitRuleManifestCodeLengthRule(32),
      new SeasonalExitRuleManifestTitleLengthRule(1000),
      new SeasonalExitRuleManifestBudgetRangeRule(0.2, 432.1),
      new SeasonalExitRuleManifestRequiredSummaryRule("seasonal exit rule manifest needs an entry"),
      new SeasonalExitRuleManifestRequiredTitleRule("seasonal exit rule manifest needs this field"),
    ],
  );
}
