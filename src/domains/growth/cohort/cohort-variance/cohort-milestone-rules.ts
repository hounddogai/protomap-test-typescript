import { CohortMilestone } from "./cohort-milestone.js";

/** A rule a cohort milestone must pass. Check returns its problems, or none. */
export interface CohortMilestoneRule {
  check(item: CohortMilestone): string[];
}

export class CohortMilestoneRequiredLocaleRule implements CohortMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortMilestone): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class CohortMilestoneRetriesRangeRule implements CohortMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortMilestone): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CohortMilestoneCodePrefixRule implements CohortMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CohortMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CohortMilestoneRevisionRangeRule implements CohortMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortMilestone): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a cohort milestone. */
export class CohortMilestoneValidator {
  rules: CohortMilestoneRule[];

  constructor(rules: CohortMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: CohortMilestone): string[] {
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

  requireValid(item: CohortMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortMilestone[]): Map<string, string[]> {
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

export function defaultCohortMilestoneValidator(): CohortMilestoneValidator {
  return new CohortMilestoneValidator(
    [
      new CohortMilestoneRequiredLocaleRule("cohort milestone needs this field"),
      new CohortMilestoneRetriesRangeRule(32, 1000),
      new CohortMilestoneCodePrefixRule("REF"),
      new CohortMilestoneRevisionRangeRule(32, 3600),
    ],
  );
}
