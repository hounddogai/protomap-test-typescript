import { LevelRollup } from "./level-rollup.js";

/** A rule a level rollup must pass. Check returns its problems, or none. */
export interface LevelRollupRule {
  check(item: LevelRollup): string[];
}

export class LevelRollupOwnerIdLengthRule implements LevelRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelRollup): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelRollupRequiredSourceRule implements LevelRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelRollup): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class LevelRollupSourceLengthRule implements LevelRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelRollup): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a level rollup. */
export class LevelRollupValidator {
  rules: LevelRollupRule[];

  constructor(rules: LevelRollupRule[]) {
    this.rules = rules;
  }

  validate(item: LevelRollup): string[] {
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

  requireValid(item: LevelRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelRollup[]): Map<string, string[]> {
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

export function defaultLevelRollupValidator(): LevelRollupValidator {
  return new LevelRollupValidator(
    [
      new LevelRollupOwnerIdLengthRule(3600),
      new LevelRollupRequiredSourceRule("level rollup needs a value"),
      new LevelRollupSourceLengthRule(255),
    ],
  );
}
