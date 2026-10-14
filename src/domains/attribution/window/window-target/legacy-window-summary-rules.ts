import { LegacyWindowSummary } from "./legacy-window-summary.js";

/** A rule a legacy window summary must pass. Check returns its problems, or none. */
export interface LegacyWindowSummaryRule {
  check(item: LegacyWindowSummary): string[];
}

export class LegacyWindowSummaryRequiredCodeRule implements LegacyWindowSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyWindowSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyWindowSummaryArchivedGuardRule implements LegacyWindowSummaryRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LegacyWindowSummary): string[] {
    if (item.archived && item.bid > this.limit) return [`bid ${item.bid} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class LegacyWindowSummaryCeilingRangeRule implements LegacyWindowSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyWindowSummary): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a legacy window summary. */
export class LegacyWindowSummaryValidator {
  rules: LegacyWindowSummaryRule[];

  constructor(rules: LegacyWindowSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyWindowSummary): string[] {
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

  requireValid(item: LegacyWindowSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyWindowSummary[]): Map<string, string[]> {
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

export function defaultLegacyWindowSummaryValidator(): LegacyWindowSummaryValidator {
  return new LegacyWindowSummaryValidator(
    [
      new LegacyWindowSummaryRequiredCodeRule("legacy window summary needs a value"),
      new LegacyWindowSummaryArchivedGuardRule(7.2),
      new LegacyWindowSummaryCeilingRangeRule(8.5, 2329.8),
    ],
  );
}
