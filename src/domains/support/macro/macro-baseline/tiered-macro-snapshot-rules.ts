import { TieredMacroSnapshot } from "./tiered-macro-snapshot.js";

/** A rule a tiered macro snapshot must pass. Check returns its problems, or none. */
export interface TieredMacroSnapshotRule {
  check(item: TieredMacroSnapshot): string[];
}

export class TieredMacroSnapshotRequiredCodeRule implements TieredMacroSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredMacroSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredMacroSnapshotCodePrefixRule implements TieredMacroSnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredMacroSnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredMacroSnapshotScoreRangeRule implements TieredMacroSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredMacroSnapshot): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a tiered macro snapshot. */
export class TieredMacroSnapshotValidator {
  rules: TieredMacroSnapshotRule[];

  constructor(rules: TieredMacroSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: TieredMacroSnapshot): string[] {
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

  requireValid(item: TieredMacroSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredMacroSnapshot[]): Map<string, string[]> {
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

export function defaultTieredMacroSnapshotValidator(): TieredMacroSnapshotValidator {
  return new TieredMacroSnapshotValidator(
    [
      new TieredMacroSnapshotRequiredCodeRule("tiered macro snapshot needs this field"),
      new TieredMacroSnapshotCodePrefixRule("REF"),
      new TieredMacroSnapshotScoreRangeRule(5.2, 757.2),
    ],
  );
}
