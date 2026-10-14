import { JourneyAdjustment } from "./journey-adjustment.js";

/** A rule a journey adjustment must pass. Check returns its problems, or none. */
export interface JourneyAdjustmentRule {
  check(item: JourneyAdjustment): string[];
}

export class JourneyAdjustmentRequiredPhoneRule implements JourneyAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyAdjustment): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyAdjustmentCodeLengthRule implements JourneyAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneyAdjustmentCodePrefixRule implements JourneyAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: JourneyAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class JourneyAdjustmentBudgetRangeRule implements JourneyAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: JourneyAdjustment): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class JourneyAdjustmentRequiredCodeRule implements JourneyAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyAdjustment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyAdjustmentPhoneLengthRule implements JourneyAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyAdjustment): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a journey adjustment. */
export class JourneyAdjustmentValidator {
  rules: JourneyAdjustmentRule[];

  constructor(rules: JourneyAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: JourneyAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyAdjustment[]): Map<string, string[]> {
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

export function defaultJourneyAdjustmentValidator(): JourneyAdjustmentValidator {
  return new JourneyAdjustmentValidator(
    [
      new JourneyAdjustmentRequiredPhoneRule("journey adjustment needs a value"),
      new JourneyAdjustmentCodeLengthRule(32),
      new JourneyAdjustmentCodePrefixRule("REF"),
      new JourneyAdjustmentBudgetRangeRule(2.7, 4329.7),
      new JourneyAdjustmentRequiredCodeRule("journey adjustment needs this field"),
      new JourneyAdjustmentPhoneLengthRule(80),
    ],
  );
}
