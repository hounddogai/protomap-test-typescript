import { SeasonalMacroProfile } from "./seasonal-macro-profile.js";

/** A rule a seasonal macro profile must pass. Check returns its problems, or none. */
export interface SeasonalMacroProfileRule {
  check(item: SeasonalMacroProfile): string[];
}

export class SeasonalMacroProfileTimezoneLengthRule implements SeasonalMacroProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalMacroProfile): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalMacroProfileRequiredCodeRule implements SeasonalMacroProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalMacroProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalMacroProfileBudgetRangeRule implements SeasonalMacroProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalMacroProfile): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalMacroProfileRequiredTitleRule implements SeasonalMacroProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalMacroProfile): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal macro profile. */
export class SeasonalMacroProfileValidator {
  rules: SeasonalMacroProfileRule[];

  constructor(rules: SeasonalMacroProfileRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalMacroProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalMacroProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalMacroProfile[]): Map<string, string[]> {
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

export function defaultSeasonalMacroProfileValidator(): SeasonalMacroProfileValidator {
  return new SeasonalMacroProfileValidator(
    [
      new SeasonalMacroProfileTimezoneLengthRule(80),
      new SeasonalMacroProfileRequiredCodeRule("seasonal macro profile needs an entry"),
      new SeasonalMacroProfileBudgetRangeRule(6.5, 161.6),
      new SeasonalMacroProfileRequiredTitleRule("seasonal macro profile needs a value"),
    ],
  );
}
