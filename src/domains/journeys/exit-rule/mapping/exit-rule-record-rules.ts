import { ExitRuleRecord } from "./exit-rule-record.js";

/** A rule a exit rule record must pass. Check returns its problems, or none. */
export interface ExitRuleRecordRule {
  check(item: ExitRuleRecord): string[];
}

export class ExitRuleRecordCodeLengthRule implements ExitRuleRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleRecord): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleRecordConversionRateRangeRule implements ExitRuleRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleRecord): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ExitRuleRecordSequenceRangeRule implements ExitRuleRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleRecord): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ExitRuleRecordCodePrefixRule implements ExitRuleRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ExitRuleRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ExitRuleRecordQuantityRangeRule implements ExitRuleRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleRecord): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ExitRuleRecordRequiredCodeRule implements ExitRuleRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a exit rule record. */
export class ExitRuleRecordValidator {
  rules: ExitRuleRecordRule[];

  constructor(rules: ExitRuleRecordRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ExitRuleRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleRecord[]): Map<string, string[]> {
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

export function defaultExitRuleRecordValidator(): ExitRuleRecordValidator {
  return new ExitRuleRecordValidator(
    [
      new ExitRuleRecordCodeLengthRule(16),
      new ExitRuleRecordConversionRateRangeRule(4.1, 1847.6),
      new ExitRuleRecordSequenceRangeRule(80, 120),
      new ExitRuleRecordCodePrefixRule("Q"),
      new ExitRuleRecordQuantityRangeRule(80, 255),
      new ExitRuleRecordRequiredCodeRule("exit rule record needs a value"),
    ],
  );
}
