import { ExitRuleBaseline } from "./exit-rule-baseline.js";

/** A rule a exit rule baseline must pass. Check returns its problems, or none. */
export interface ExitRuleBaselineRule {
  check(item: ExitRuleBaseline): string[];
}

export class ExitRuleBaselineRequiredNameRule implements ExitRuleBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleBaseline): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRuleBaselineWindowDaysRangeRule implements ExitRuleBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleBaseline): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ExitRuleBaselineRequiredCodeRule implements ExitRuleBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRuleBaselineRequiredTitleRule implements ExitRuleBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleBaseline): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a exit rule baseline. */
export class ExitRuleBaselineValidator {
  rules: ExitRuleBaselineRule[];

  constructor(rules: ExitRuleBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleBaseline): string[] {
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

  requireValid(item: ExitRuleBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleBaseline[]): Map<string, string[]> {
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

export function defaultExitRuleBaselineValidator(): ExitRuleBaselineValidator {
  return new ExitRuleBaselineValidator(
    [
      new ExitRuleBaselineRequiredNameRule("exit rule baseline needs this field"),
      new ExitRuleBaselineWindowDaysRangeRule(16, 120),
      new ExitRuleBaselineRequiredCodeRule("exit rule baseline needs an entry"),
      new ExitRuleBaselineRequiredTitleRule("exit rule baseline needs a value"),
    ],
  );
}
