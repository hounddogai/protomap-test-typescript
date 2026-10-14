import { DefaultMacroBaseline } from "./default-macro-baseline.js";

/** A rule a default macro baseline must pass. Check returns its problems, or none. */
export interface DefaultMacroBaselineRule {
  check(item: DefaultMacroBaseline): string[];
}

export class DefaultMacroBaselineRequiredNameRule implements DefaultMacroBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultMacroBaseline): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultMacroBaselineRequiredCodeRule implements DefaultMacroBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultMacroBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultMacroBaselineRatioRangeRule implements DefaultMacroBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultMacroBaseline): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultMacroBaselineAmountRangeRule implements DefaultMacroBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultMacroBaseline): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a default macro baseline. */
export class DefaultMacroBaselineValidator {
  rules: DefaultMacroBaselineRule[];

  constructor(rules: DefaultMacroBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultMacroBaseline): string[] {
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

  requireValid(item: DefaultMacroBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultMacroBaseline[]): Map<string, string[]> {
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

export function defaultDefaultMacroBaselineValidator(): DefaultMacroBaselineValidator {
  return new DefaultMacroBaselineValidator(
    [
      new DefaultMacroBaselineRequiredNameRule("default macro baseline needs a value"),
      new DefaultMacroBaselineRequiredCodeRule("default macro baseline needs an entry"),
      new DefaultMacroBaselineRatioRangeRule(9.4, 1246.1),
      new DefaultMacroBaselineAmountRangeRule(8.6, 3879.4),
    ],
  );
}
