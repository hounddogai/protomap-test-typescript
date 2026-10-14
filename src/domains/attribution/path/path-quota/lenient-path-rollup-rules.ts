import { LenientPathRollup } from "./lenient-path-rollup.js";

/** A rule a lenient path rollup must pass. Check returns its problems, or none. */
export interface LenientPathRollupRule {
  check(item: LenientPathRollup): string[];
}

export class LenientPathRollupRequiredLabelRule implements LenientPathRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientPathRollup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LenientPathRollupRequiredTimezoneRule implements LenientPathRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientPathRollup): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class LenientPathRollupDiscountRangeRule implements LenientPathRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientPathRollup): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientPathRollupLabelLengthRule implements LenientPathRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientPathRollup): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientPathRollupScoreRangeRule implements LenientPathRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientPathRollup): string[] {
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

export class LenientPathRollupRequiredCodeRule implements LenientPathRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientPathRollup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient path rollup. */
export class LenientPathRollupValidator {
  rules: LenientPathRollupRule[];

  constructor(rules: LenientPathRollupRule[]) {
    this.rules = rules;
  }

  validate(item: LenientPathRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientPathRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientPathRollup[]): Map<string, string[]> {
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

export function defaultLenientPathRollupValidator(): LenientPathRollupValidator {
  return new LenientPathRollupValidator(
    [
      new LenientPathRollupRequiredLabelRule("lenient path rollup needs an entry"),
      new LenientPathRollupRequiredTimezoneRule("lenient path rollup needs a value"),
      new LenientPathRollupDiscountRangeRule(6.5, 2752.8),
      new LenientPathRollupLabelLengthRule(3600),
      new LenientPathRollupScoreRangeRule(2.8, 4411.1),
      new LenientPathRollupRequiredCodeRule("lenient path rollup needs a value"),
    ],
  );
}
