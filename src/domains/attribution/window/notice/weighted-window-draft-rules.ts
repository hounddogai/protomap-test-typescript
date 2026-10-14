import { WeightedWindowDraft } from "./weighted-window-draft.js";

/** A rule a weighted window draft must pass. Check returns its problems, or none. */
export interface WeightedWindowDraftRule {
  check(item: WeightedWindowDraft): string[];
}

export class WeightedWindowDraftRequiredLabelRule implements WeightedWindowDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedWindowDraft): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedWindowDraftConversionRateRangeRule implements WeightedWindowDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedWindowDraft): string[] {
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

export class WeightedWindowDraftScoreRangeRule implements WeightedWindowDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedWindowDraft): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedWindowDraftRequiredCodeRule implements WeightedWindowDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedWindowDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedWindowDraftVariantLengthRule implements WeightedWindowDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedWindowDraft): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedWindowDraftRequiredVariantRule implements WeightedWindowDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedWindowDraft): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted window draft. */
export class WeightedWindowDraftValidator {
  rules: WeightedWindowDraftRule[];

  constructor(rules: WeightedWindowDraftRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedWindowDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedWindowDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedWindowDraft[]): Map<string, string[]> {
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

export function defaultWeightedWindowDraftValidator(): WeightedWindowDraftValidator {
  return new WeightedWindowDraftValidator(
    [
      new WeightedWindowDraftRequiredLabelRule("weighted window draft needs this field"),
      new WeightedWindowDraftConversionRateRangeRule(2.9, 4569.9),
      new WeightedWindowDraftScoreRangeRule(3, 113.2),
      new WeightedWindowDraftRequiredCodeRule("weighted window draft needs a value"),
      new WeightedWindowDraftVariantLengthRule(32),
      new WeightedWindowDraftRequiredVariantRule("weighted window draft needs this field"),
    ],
  );
}
