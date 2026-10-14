import { GlobalCreativeSummary } from "./global-creative-summary.js";

/** A rule a global creative summary must pass. Check returns its problems, or none. */
export interface GlobalCreativeSummaryRule {
  check(item: GlobalCreativeSummary): string[];
}

export class GlobalCreativeSummaryRequiredLabelRule implements GlobalCreativeSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalCreativeSummary): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalCreativeSummaryRequiredCodeRule implements GlobalCreativeSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalCreativeSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalCreativeSummaryStartsAtRangeRule implements GlobalCreativeSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalCreativeSummary): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a global creative summary. */
export class GlobalCreativeSummaryValidator {
  rules: GlobalCreativeSummaryRule[];

  constructor(rules: GlobalCreativeSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalCreativeSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalCreativeSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalCreativeSummary[]): Map<string, string[]> {
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

export function defaultGlobalCreativeSummaryValidator(): GlobalCreativeSummaryValidator {
  return new GlobalCreativeSummaryValidator(
    [
      new GlobalCreativeSummaryRequiredLabelRule("global creative summary needs an entry"),
      new GlobalCreativeSummaryRequiredCodeRule("global creative summary needs an entry"),
      new GlobalCreativeSummaryStartsAtRangeRule(1000, 1000),
    ],
  );
}
