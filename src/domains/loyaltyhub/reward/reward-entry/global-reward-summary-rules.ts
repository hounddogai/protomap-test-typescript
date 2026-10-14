import { GlobalRewardSummary } from "./global-reward-summary.js";

/** A rule a global reward summary must pass. Check returns its problems, or none. */
export interface GlobalRewardSummaryRule {
  check(item: GlobalRewardSummary): string[];
}

export class GlobalRewardSummaryRequiredTitleRule implements GlobalRewardSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalRewardSummary): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalRewardSummaryMinimumRangeRule implements GlobalRewardSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalRewardSummary): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalRewardSummaryRequiredRegionRule implements GlobalRewardSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalRewardSummary): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalRewardSummaryRequiredCodeRule implements GlobalRewardSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalRewardSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalRewardSummaryAttemptsRangeRule implements GlobalRewardSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalRewardSummary): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a global reward summary. */
export class GlobalRewardSummaryValidator {
  rules: GlobalRewardSummaryRule[];

  constructor(rules: GlobalRewardSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalRewardSummary): string[] {
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

  requireValid(item: GlobalRewardSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalRewardSummary[]): Map<string, string[]> {
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

export function defaultGlobalRewardSummaryValidator(): GlobalRewardSummaryValidator {
  return new GlobalRewardSummaryValidator(
    [
      new GlobalRewardSummaryRequiredTitleRule("global reward summary needs a value"),
      new GlobalRewardSummaryMinimumRangeRule(2.8, 2197.7),
      new GlobalRewardSummaryRequiredRegionRule("global reward summary needs this field"),
      new GlobalRewardSummaryRequiredCodeRule("global reward summary needs a value"),
      new GlobalRewardSummaryAttemptsRangeRule(32, 1000),
    ],
  );
}
