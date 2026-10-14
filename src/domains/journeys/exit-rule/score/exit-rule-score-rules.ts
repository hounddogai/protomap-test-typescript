import { ExitRuleScore } from "./exit-rule-score.js";

/** A rule a exit rule score must pass. Check returns its problems, or none. */
export interface ExitRuleScoreRule {
  check(item: ExitRuleScore): string[];
}

export class ExitRuleScoreNameLengthRule implements ExitRuleScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleScore): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleScoreRequiredLocaleRule implements ExitRuleScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleScore): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRuleScoreRequiredChecksumRule implements ExitRuleScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleScore): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRuleScoreQuantityRangeRule implements ExitRuleScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleScore): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a exit rule score. */
export class ExitRuleScoreValidator {
  rules: ExitRuleScoreRule[];

  constructor(rules: ExitRuleScoreRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleScore): string[] {
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

  requireValid(item: ExitRuleScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleScore[]): Map<string, string[]> {
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

export function defaultExitRuleScoreValidator(): ExitRuleScoreValidator {
  return new ExitRuleScoreValidator(
    [
      new ExitRuleScoreNameLengthRule(120),
      new ExitRuleScoreRequiredLocaleRule("exit rule score needs a value"),
      new ExitRuleScoreRequiredChecksumRule("exit rule score needs this field"),
      new ExitRuleScoreQuantityRangeRule(64, 86400),
    ],
  );
}
