import { ExitRuleTier } from "./exit-rule-tier.js";

/** A rule a exit rule tier must pass. Check returns its problems, or none. */
export interface ExitRuleTierRule {
  check(item: ExitRuleTier): string[];
}

export class ExitRuleTierRequiredLabelRule implements ExitRuleTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleTier): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRuleTierCodeLengthRule implements ExitRuleTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleTierLimitRangeRule implements ExitRuleTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleTier): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a exit rule tier. */
export class ExitRuleTierValidator {
  rules: ExitRuleTierRule[];

  constructor(rules: ExitRuleTierRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ExitRuleTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleTier[]): Map<string, string[]> {
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

export function defaultExitRuleTierValidator(): ExitRuleTierValidator {
  return new ExitRuleTierValidator(
    [
      new ExitRuleTierRequiredLabelRule("exit rule tier needs an entry"),
      new ExitRuleTierCodeLengthRule(64),
      new ExitRuleTierLimitRangeRule(16, 3600),
    ],
  );
}
