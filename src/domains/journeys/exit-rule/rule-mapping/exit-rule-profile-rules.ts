import { ExitRuleProfile } from "./exit-rule-profile.js";

/** A rule a exit rule profile must pass. Check returns its problems, or none. */
export interface ExitRuleProfileRule {
  check(item: ExitRuleProfile): string[];
}

export class ExitRuleProfileRequiredSegmentRule implements ExitRuleProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleProfile): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRuleProfileMinimumRangeRule implements ExitRuleProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleProfile): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ExitRuleProfileRequiredCodeRule implements ExitRuleProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a exit rule profile. */
export class ExitRuleProfileValidator {
  rules: ExitRuleProfileRule[];

  constructor(rules: ExitRuleProfileRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleProfile): string[] {
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

  requireValid(item: ExitRuleProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleProfile[]): Map<string, string[]> {
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

export function defaultExitRuleProfileValidator(): ExitRuleProfileValidator {
  return new ExitRuleProfileValidator(
    [
      new ExitRuleProfileRequiredSegmentRule("exit rule profile needs an entry"),
      new ExitRuleProfileMinimumRangeRule(4.5, 3295.9),
      new ExitRuleProfileRequiredCodeRule("exit rule profile needs a value"),
    ],
  );
}
