import { JourneySummary } from "./journey-summary.js";

/** A rule a journey summary must pass. Check returns its problems, or none. */
export interface JourneySummaryRule {
  check(item: JourneySummary): string[];
}

export class JourneySummaryUtmSourceLengthRule implements JourneySummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneySummary): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneySummaryOpenRateRangeRule implements JourneySummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: JourneySummary): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class JourneySummaryNameLengthRule implements JourneySummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneySummary): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneySummaryPinnedGuardRule implements JourneySummaryRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: JourneySummary): string[] {
    if (item.pinned && item.openRate > this.limit) return [`open rate ${item.openRate} exceeds ${this.limit} while pinned`];
    return [];
  }
}

/** Runs every rule of a journey summary. */
export class JourneySummaryValidator {
  rules: JourneySummaryRule[];

  constructor(rules: JourneySummaryRule[]) {
    this.rules = rules;
  }

  validate(item: JourneySummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: JourneySummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneySummary[]): Map<string, string[]> {
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

export function defaultJourneySummaryValidator(): JourneySummaryValidator {
  return new JourneySummaryValidator(
    [
      new JourneySummaryUtmSourceLengthRule(64),
      new JourneySummaryOpenRateRangeRule(2.5, 4376.2),
      new JourneySummaryNameLengthRule(64),
      new JourneySummaryPinnedGuardRule(9.4),
    ],
  );
}
