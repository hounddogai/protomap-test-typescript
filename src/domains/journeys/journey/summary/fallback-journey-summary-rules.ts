import { FallbackJourneySummary } from "./fallback-journey-summary.js";

/** A rule a fallback journey summary must pass. Check returns its problems, or none. */
export interface FallbackJourneySummaryRule {
  check(item: FallbackJourneySummary): string[];
}

export class FallbackJourneySummaryAmountRangeRule implements FallbackJourneySummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackJourneySummary): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackJourneySummaryRequiredCohortRule implements FallbackJourneySummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackJourneySummary): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackJourneySummaryRequiredCodeRule implements FallbackJourneySummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackJourneySummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackJourneySummaryCostRangeRule implements FallbackJourneySummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackJourneySummary): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackJourneySummaryCodePrefixRule implements FallbackJourneySummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackJourneySummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a fallback journey summary. */
export class FallbackJourneySummaryValidator {
  rules: FallbackJourneySummaryRule[];

  constructor(rules: FallbackJourneySummaryRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackJourneySummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackJourneySummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackJourneySummary[]): Map<string, string[]> {
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

export function defaultFallbackJourneySummaryValidator(): FallbackJourneySummaryValidator {
  return new FallbackJourneySummaryValidator(
    [
      new FallbackJourneySummaryAmountRangeRule(8, 359.9),
      new FallbackJourneySummaryRequiredCohortRule("fallback journey summary needs a value"),
      new FallbackJourneySummaryRequiredCodeRule("fallback journey summary needs an entry"),
      new FallbackJourneySummaryCostRangeRule(8.9, 1713.2),
      new FallbackJourneySummaryCodePrefixRule("REF"),
    ],
  );
}
