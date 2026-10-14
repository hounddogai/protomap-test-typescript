import { LevelVariance } from "./level-variance.js";

/** A rule a level variance must pass. Check returns its problems, or none. */
export interface LevelVarianceRule {
  check(item: LevelVariance): string[];
}

export class LevelVarianceRequiredCodeRule implements LevelVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LevelVarianceRequiredCountryRule implements LevelVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelVariance): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class LevelVarianceRequiredTitleRule implements LevelVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelVariance): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LevelVarianceCountryLengthRule implements LevelVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelVariance): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a level variance. */
export class LevelVarianceValidator {
  rules: LevelVarianceRule[];

  constructor(rules: LevelVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: LevelVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LevelVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelVariance[]): Map<string, string[]> {
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

export function defaultLevelVarianceValidator(): LevelVarianceValidator {
  return new LevelVarianceValidator(
    [
      new LevelVarianceRequiredCodeRule("level variance needs this field"),
      new LevelVarianceRequiredCountryRule("level variance needs this field"),
      new LevelVarianceRequiredTitleRule("level variance needs an entry"),
      new LevelVarianceCountryLengthRule(255),
    ],
  );
}
