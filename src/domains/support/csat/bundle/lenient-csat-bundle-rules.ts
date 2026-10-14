import { LenientCsatBundle } from "./lenient-csat-bundle.js";

/** A rule a lenient csat bundle must pass. Check returns its problems, or none. */
export interface LenientCsatBundleRule {
  check(item: LenientCsatBundle): string[];
}

export class LenientCsatBundleCategoryLengthRule implements LenientCsatBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientCsatBundle): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientCsatBundleRequiredTitleRule implements LenientCsatBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientCsatBundle): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LenientCsatBundleTitleLengthRule implements LenientCsatBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientCsatBundle): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient csat bundle. */
export class LenientCsatBundleValidator {
  rules: LenientCsatBundleRule[];

  constructor(rules: LenientCsatBundleRule[]) {
    this.rules = rules;
  }

  validate(item: LenientCsatBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientCsatBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientCsatBundle[]): Map<string, string[]> {
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

export function defaultLenientCsatBundleValidator(): LenientCsatBundleValidator {
  return new LenientCsatBundleValidator(
    [
      new LenientCsatBundleCategoryLengthRule(255),
      new LenientCsatBundleRequiredTitleRule("lenient csat bundle needs a value"),
      new LenientCsatBundleTitleLengthRule(16),
    ],
  );
}
