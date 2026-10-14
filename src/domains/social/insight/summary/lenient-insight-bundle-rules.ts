import { LenientInsightBundle } from "./lenient-insight-bundle.js";

/** A rule a lenient insight bundle must pass. Check returns its problems, or none. */
export interface LenientInsightBundleRule {
  check(item: LenientInsightBundle): string[];
}

export class LenientInsightBundleRequiredCodeRule implements LenientInsightBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientInsightBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientInsightBundleBudgetRangeRule implements LenientInsightBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientInsightBundle): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientInsightBundleNameLengthRule implements LenientInsightBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientInsightBundle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientInsightBundleRequiredNameRule implements LenientInsightBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientInsightBundle): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient insight bundle. */
export class LenientInsightBundleValidator {
  rules: LenientInsightBundleRule[];

  constructor(rules: LenientInsightBundleRule[]) {
    this.rules = rules;
  }

  validate(item: LenientInsightBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientInsightBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientInsightBundle[]): Map<string, string[]> {
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

export function defaultLenientInsightBundleValidator(): LenientInsightBundleValidator {
  return new LenientInsightBundleValidator(
    [
      new LenientInsightBundleRequiredCodeRule("lenient insight bundle needs this field"),
      new LenientInsightBundleBudgetRangeRule(5.6, 3958.6),
      new LenientInsightBundleNameLengthRule(86400),
      new LenientInsightBundleRequiredNameRule("lenient insight bundle needs an entry"),
    ],
  );
}
