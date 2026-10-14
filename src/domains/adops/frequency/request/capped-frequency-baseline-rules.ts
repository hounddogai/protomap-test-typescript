import { CappedFrequencyBaseline } from "./capped-frequency-baseline.js";

/** A rule a capped frequency baseline must pass. Check returns its problems, or none. */
export interface CappedFrequencyBaselineRule {
  check(item: CappedFrequencyBaseline): string[];
}

export class CappedFrequencyBaselineRequiredNameRule implements CappedFrequencyBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedFrequencyBaseline): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CappedFrequencyBaselineQuantityRangeRule implements CappedFrequencyBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedFrequencyBaseline): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedFrequencyBaselineRequiredDescriptionRule implements CappedFrequencyBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedFrequencyBaseline): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped frequency baseline. */
export class CappedFrequencyBaselineValidator {
  rules: CappedFrequencyBaselineRule[];

  constructor(rules: CappedFrequencyBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: CappedFrequencyBaseline): string[] {
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

  requireValid(item: CappedFrequencyBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedFrequencyBaseline[]): Map<string, string[]> {
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

export function defaultCappedFrequencyBaselineValidator(): CappedFrequencyBaselineValidator {
  return new CappedFrequencyBaselineValidator(
    [
      new CappedFrequencyBaselineRequiredNameRule("capped frequency baseline needs a value"),
      new CappedFrequencyBaselineQuantityRangeRule(16, 80),
      new CappedFrequencyBaselineRequiredDescriptionRule("capped frequency baseline needs an entry"),
    ],
  );
}
