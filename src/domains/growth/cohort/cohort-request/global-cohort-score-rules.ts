import { GlobalCohortScore } from "./global-cohort-score.js";

/** A rule a global cohort score must pass. Check returns its problems, or none. */
export interface GlobalCohortScoreRule {
  check(item: GlobalCohortScore): string[];
}

export class GlobalCohortScoreClicksRangeRule implements GlobalCohortScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalCohortScore): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalCohortScoreCodePrefixRule implements GlobalCohortScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalCohortScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalCohortScoreThresholdRangeRule implements GlobalCohortScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalCohortScore): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalCohortScoreBudgetRangeRule implements GlobalCohortScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalCohortScore): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalCohortScoreRequiredRegionRule implements GlobalCohortScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalCohortScore): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalCohortScoreRequiredCodeRule implements GlobalCohortScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalCohortScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global cohort score. */
export class GlobalCohortScoreValidator {
  rules: GlobalCohortScoreRule[];

  constructor(rules: GlobalCohortScoreRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalCohortScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalCohortScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalCohortScore[]): Map<string, string[]> {
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

export function defaultGlobalCohortScoreValidator(): GlobalCohortScoreValidator {
  return new GlobalCohortScoreValidator(
    [
      new GlobalCohortScoreClicksRangeRule(120, 255),
      new GlobalCohortScoreCodePrefixRule("Q"),
      new GlobalCohortScoreThresholdRangeRule(4.5, 2125.5),
      new GlobalCohortScoreBudgetRangeRule(2.1, 1015.6),
      new GlobalCohortScoreRequiredRegionRule("global cohort score needs this field"),
      new GlobalCohortScoreRequiredCodeRule("global cohort score needs this field"),
    ],
  );
}
