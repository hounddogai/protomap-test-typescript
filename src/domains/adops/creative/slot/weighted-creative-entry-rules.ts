import { WeightedCreativeEntry } from "./weighted-creative-entry.js";

/** A rule a weighted creative entry must pass. Check returns its problems, or none. */
export interface WeightedCreativeEntryRule {
  check(item: WeightedCreativeEntry): string[];
}

export class WeightedCreativeEntryCodeLengthRule implements WeightedCreativeEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedCreativeEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedCreativeEntryRequiredTitleRule implements WeightedCreativeEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedCreativeEntry): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedCreativeEntryConversionRateRangeRule implements WeightedCreativeEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedCreativeEntry): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedCreativeEntryRequiredPhoneRule implements WeightedCreativeEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedCreativeEntry): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedCreativeEntryLabelLengthRule implements WeightedCreativeEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedCreativeEntry): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedCreativeEntryRequiredLabelRule implements WeightedCreativeEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedCreativeEntry): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted creative entry. */
export class WeightedCreativeEntryValidator {
  rules: WeightedCreativeEntryRule[];

  constructor(rules: WeightedCreativeEntryRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedCreativeEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedCreativeEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedCreativeEntry[]): Map<string, string[]> {
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

export function defaultWeightedCreativeEntryValidator(): WeightedCreativeEntryValidator {
  return new WeightedCreativeEntryValidator(
    [
      new WeightedCreativeEntryCodeLengthRule(255),
      new WeightedCreativeEntryRequiredTitleRule("weighted creative entry needs this field"),
      new WeightedCreativeEntryConversionRateRangeRule(4.6, 1193.9),
      new WeightedCreativeEntryRequiredPhoneRule("weighted creative entry needs this field"),
      new WeightedCreativeEntryLabelLengthRule(64),
      new WeightedCreativeEntryRequiredLabelRule("weighted creative entry needs a value"),
    ],
  );
}
