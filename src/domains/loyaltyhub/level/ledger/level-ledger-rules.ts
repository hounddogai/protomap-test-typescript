import { LevelLedger } from "./level-ledger.js";

/** A rule a level ledger must pass. Check returns its problems, or none. */
export interface LevelLedgerRule {
  check(item: LevelLedger): string[];
}

export class LevelLedgerImpressionsRangeRule implements LevelLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LevelLedger): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LevelLedgerRequiredCodeRule implements LevelLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LevelLedgerCategoryLengthRule implements LevelLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelLedger): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelLedgerNameLengthRule implements LevelLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelLedger): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelLedgerCapacityRangeRule implements LevelLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LevelLedger): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a level ledger. */
export class LevelLedgerValidator {
  rules: LevelLedgerRule[];

  constructor(rules: LevelLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: LevelLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LevelLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelLedger[]): Map<string, string[]> {
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

export function defaultLevelLedgerValidator(): LevelLedgerValidator {
  return new LevelLedgerValidator(
    [
      new LevelLedgerImpressionsRangeRule(32, 86400),
      new LevelLedgerRequiredCodeRule("level ledger needs a value"),
      new LevelLedgerCategoryLengthRule(1000),
      new LevelLedgerNameLengthRule(86400),
      new LevelLedgerCapacityRangeRule(86400, 86400),
    ],
  );
}
