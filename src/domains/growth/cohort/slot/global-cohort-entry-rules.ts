import { GlobalCohortEntry } from "./global-cohort-entry.js";

/** A rule a global cohort entry must pass. Check returns its problems, or none. */
export interface GlobalCohortEntryRule {
  check(item: GlobalCohortEntry): string[];
}

export class GlobalCohortEntryRequiredCodeRule implements GlobalCohortEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalCohortEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalCohortEntryCodeLengthRule implements GlobalCohortEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalCohortEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalCohortEntryRequiredTitleRule implements GlobalCohortEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalCohortEntry): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalCohortEntryCostRangeRule implements GlobalCohortEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalCohortEntry): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a global cohort entry. */
export class GlobalCohortEntryValidator {
  rules: GlobalCohortEntryRule[];

  constructor(rules: GlobalCohortEntryRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalCohortEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalCohortEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalCohortEntry[]): Map<string, string[]> {
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

export function defaultGlobalCohortEntryValidator(): GlobalCohortEntryValidator {
  return new GlobalCohortEntryValidator(
    [
      new GlobalCohortEntryRequiredCodeRule("global cohort entry needs a value"),
      new GlobalCohortEntryCodeLengthRule(32),
      new GlobalCohortEntryRequiredTitleRule("global cohort entry needs a value"),
      new GlobalCohortEntryCostRangeRule(6.5, 3162.5),
    ],
  );
}
