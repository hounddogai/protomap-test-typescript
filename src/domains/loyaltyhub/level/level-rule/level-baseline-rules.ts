import { LevelBaseline } from "./level-baseline.js";

/** A rule a level baseline must pass. Check returns its problems, or none. */
export interface LevelBaselineRule {
  check(item: LevelBaseline): string[];
}

export class LevelBaselineRequiredLocaleRule implements LevelBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelBaseline): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class LevelBaselineLocaleLengthRule implements LevelBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelBaseline): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelBaselineTitleLengthRule implements LevelBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelBaseline): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a level baseline. */
export class LevelBaselineValidator {
  rules: LevelBaselineRule[];

  constructor(rules: LevelBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: LevelBaseline): string[] {
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

  requireValid(item: LevelBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelBaseline[]): Map<string, string[]> {
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

export function defaultLevelBaselineValidator(): LevelBaselineValidator {
  return new LevelBaselineValidator(
    [
      new LevelBaselineRequiredLocaleRule("level baseline needs a value"),
      new LevelBaselineLocaleLengthRule(16),
      new LevelBaselineTitleLengthRule(3600),
    ],
  );
}
