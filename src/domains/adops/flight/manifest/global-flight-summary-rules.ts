import { GlobalFlightSummary } from "./global-flight-summary.js";

/** A rule a global flight summary must pass. Check returns its problems, or none. */
export interface GlobalFlightSummaryRule {
  check(item: GlobalFlightSummary): string[];
}

export class GlobalFlightSummaryRequiredNameRule implements GlobalFlightSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalFlightSummary): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalFlightSummaryGraceDaysRangeRule implements GlobalFlightSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalFlightSummary): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalFlightSummaryRequiredLabelRule implements GlobalFlightSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalFlightSummary): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global flight summary. */
export class GlobalFlightSummaryValidator {
  rules: GlobalFlightSummaryRule[];

  constructor(rules: GlobalFlightSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalFlightSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalFlightSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalFlightSummary[]): Map<string, string[]> {
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

export function defaultGlobalFlightSummaryValidator(): GlobalFlightSummaryValidator {
  return new GlobalFlightSummaryValidator(
    [
      new GlobalFlightSummaryRequiredNameRule("global flight summary needs an entry"),
      new GlobalFlightSummaryGraceDaysRangeRule(16, 64),
      new GlobalFlightSummaryRequiredLabelRule("global flight summary needs a value"),
    ],
  );
}
