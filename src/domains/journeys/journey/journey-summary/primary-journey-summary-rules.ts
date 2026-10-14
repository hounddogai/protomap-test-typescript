import { PrimaryJourneySummary } from "./primary-journey-summary.js";

/** A rule a primary journey summary must pass. Check returns its problems, or none. */
export interface PrimaryJourneySummaryRule {
  check(item: PrimaryJourneySummary): string[];
}

export class PrimaryJourneySummaryCodePrefixRule implements PrimaryJourneySummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryJourneySummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryJourneySummaryRequiredLabelRule implements PrimaryJourneySummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryJourneySummary): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryJourneySummaryRetriesRangeRule implements PrimaryJourneySummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryJourneySummary): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryJourneySummaryLabelLengthRule implements PrimaryJourneySummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryJourneySummary): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary journey summary. */
export class PrimaryJourneySummaryValidator {
  rules: PrimaryJourneySummaryRule[];

  constructor(rules: PrimaryJourneySummaryRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryJourneySummary): string[] {
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

  requireValid(item: PrimaryJourneySummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryJourneySummary[]): Map<string, string[]> {
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

export function defaultPrimaryJourneySummaryValidator(): PrimaryJourneySummaryValidator {
  return new PrimaryJourneySummaryValidator(
    [
      new PrimaryJourneySummaryCodePrefixRule("REF"),
      new PrimaryJourneySummaryRequiredLabelRule("primary journey summary needs a value"),
      new PrimaryJourneySummaryRetriesRangeRule(64, 86400),
      new PrimaryJourneySummaryLabelLengthRule(32),
    ],
  );
}
