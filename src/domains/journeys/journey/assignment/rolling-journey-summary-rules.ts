import { RollingJourneySummary } from "./rolling-journey-summary.js";

/** A rule a rolling journey summary must pass. Check returns its problems, or none. */
export interface RollingJourneySummaryRule {
  check(item: RollingJourneySummary): string[];
}

export class RollingJourneySummaryTimezoneLengthRule implements RollingJourneySummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingJourneySummary): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingJourneySummaryRequiredCodeRule implements RollingJourneySummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingJourneySummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingJourneySummaryRequiredTimezoneRule implements RollingJourneySummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingJourneySummary): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class RollingJourneySummaryPriorityRangeRule implements RollingJourneySummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingJourneySummary): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a rolling journey summary. */
export class RollingJourneySummaryValidator {
  rules: RollingJourneySummaryRule[];

  constructor(rules: RollingJourneySummaryRule[]) {
    this.rules = rules;
  }

  validate(item: RollingJourneySummary): string[] {
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

  requireValid(item: RollingJourneySummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingJourneySummary[]): Map<string, string[]> {
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

export function defaultRollingJourneySummaryValidator(): RollingJourneySummaryValidator {
  return new RollingJourneySummaryValidator(
    [
      new RollingJourneySummaryTimezoneLengthRule(32),
      new RollingJourneySummaryRequiredCodeRule("rolling journey summary needs this field"),
      new RollingJourneySummaryRequiredTimezoneRule("rolling journey summary needs this field"),
      new RollingJourneySummaryPriorityRangeRule(255, 86400),
    ],
  );
}
