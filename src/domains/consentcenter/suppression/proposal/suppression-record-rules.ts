import { SuppressionRecord } from "./suppression-record.js";

/** A rule a suppression record must pass. Check returns its problems, or none. */
export interface SuppressionRecordRule {
  check(item: SuppressionRecord): string[];
}

export class SuppressionRecordRequiredCurrencyRule implements SuppressionRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionRecord): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionRecordCodePrefixRule implements SuppressionRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SuppressionRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SuppressionRecordRequiredTitleRule implements SuppressionRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionRecord): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a suppression record. */
export class SuppressionRecordValidator {
  rules: SuppressionRecordRule[];

  constructor(rules: SuppressionRecordRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionRecord): string[] {
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

  requireValid(item: SuppressionRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionRecord[]): Map<string, string[]> {
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

export function defaultSuppressionRecordValidator(): SuppressionRecordValidator {
  return new SuppressionRecordValidator(
    [
      new SuppressionRecordRequiredCurrencyRule("suppression record needs an entry"),
      new SuppressionRecordCodePrefixRule("ACM"),
      new SuppressionRecordRequiredTitleRule("suppression record needs an entry"),
    ],
  );
}
