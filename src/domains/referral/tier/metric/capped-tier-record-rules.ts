import { CappedTierRecord } from "./capped-tier-record.js";

/** A rule a capped tier record must pass. Check returns its problems, or none. */
export interface CappedTierRecordRule {
  check(item: CappedTierRecord): string[];
}

export class CappedTierRecordUpdatedAtRangeRule implements CappedTierRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedTierRecord): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedTierRecordRequiredCategoryRule implements CappedTierRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedTierRecord): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class CappedTierRecordRequiredNameRule implements CappedTierRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedTierRecord): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped tier record. */
export class CappedTierRecordValidator {
  rules: CappedTierRecordRule[];

  constructor(rules: CappedTierRecordRule[]) {
    this.rules = rules;
  }

  validate(item: CappedTierRecord): string[] {
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

  requireValid(item: CappedTierRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedTierRecord[]): Map<string, string[]> {
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

export function defaultCappedTierRecordValidator(): CappedTierRecordValidator {
  return new CappedTierRecordValidator(
    [
      new CappedTierRecordUpdatedAtRangeRule(80, 3600),
      new CappedTierRecordRequiredCategoryRule("capped tier record needs an entry"),
      new CappedTierRecordRequiredNameRule("capped tier record needs this field"),
    ],
  );
}
