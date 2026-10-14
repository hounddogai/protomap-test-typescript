import { PreferenceSummary } from "./preference-summary.js";

/** A rule a preference summary must pass. Check returns its problems, or none. */
export interface PreferenceSummaryRule {
  check(item: PreferenceSummary): string[];
}

export class PreferenceSummaryNameLengthRule implements PreferenceSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceSummary): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceSummaryChecksumLengthRule implements PreferenceSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceSummary): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceSummaryArchivedGuardRule implements PreferenceSummaryRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PreferenceSummary): string[] {
    if (item.archived && item.quantity > this.limit) return [`quantity ${item.quantity} exceeds ${this.limit} while archived`];
    return [];
  }
}

/** Runs every rule of a preference summary. */
export class PreferenceSummaryValidator {
  rules: PreferenceSummaryRule[];

  constructor(rules: PreferenceSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceSummary): string[] {
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

  requireValid(item: PreferenceSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceSummary[]): Map<string, string[]> {
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

export function defaultPreferenceSummaryValidator(): PreferenceSummaryValidator {
  return new PreferenceSummaryValidator(
    [
      new PreferenceSummaryNameLengthRule(32),
      new PreferenceSummaryChecksumLengthRule(3600),
      new PreferenceSummaryArchivedGuardRule(3600),
    ],
  );
}
