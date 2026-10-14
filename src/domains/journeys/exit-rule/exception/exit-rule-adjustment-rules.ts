import { ExitRuleAdjustment } from "./exit-rule-adjustment.js";

/** A rule a exit rule adjustment must pass. Check returns its problems, or none. */
export interface ExitRuleAdjustmentRule {
  check(item: ExitRuleAdjustment): string[];
}

export class ExitRuleAdjustmentTitleLengthRule implements ExitRuleAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleAdjustment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleAdjustmentNotesLengthRule implements ExitRuleAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleAdjustment): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleAdjustmentRequiredNotesRule implements ExitRuleAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleAdjustment): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRuleAdjustmentClicksRangeRule implements ExitRuleAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleAdjustment): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ExitRuleAdjustmentWeightRangeRule implements ExitRuleAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleAdjustment): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ExitRuleAdjustmentRequiredTitleRule implements ExitRuleAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleAdjustment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a exit rule adjustment. */
export class ExitRuleAdjustmentValidator {
  rules: ExitRuleAdjustmentRule[];

  constructor(rules: ExitRuleAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleAdjustment): string[] {
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

  requireValid(item: ExitRuleAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleAdjustment[]): Map<string, string[]> {
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

export function defaultExitRuleAdjustmentValidator(): ExitRuleAdjustmentValidator {
  return new ExitRuleAdjustmentValidator(
    [
      new ExitRuleAdjustmentTitleLengthRule(255),
      new ExitRuleAdjustmentNotesLengthRule(16),
      new ExitRuleAdjustmentRequiredNotesRule("exit rule adjustment needs a value"),
      new ExitRuleAdjustmentClicksRangeRule(64, 80),
      new ExitRuleAdjustmentWeightRangeRule(8.9, 948.1),
      new ExitRuleAdjustmentRequiredTitleRule("exit rule adjustment needs a value"),
    ],
  );
}
