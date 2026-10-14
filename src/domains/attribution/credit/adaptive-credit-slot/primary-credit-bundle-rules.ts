import { PrimaryCreditBundle } from "./primary-credit-bundle.js";

/** A rule a primary credit bundle must pass. Check returns its problems, or none. */
export interface PrimaryCreditBundleRule {
  check(item: PrimaryCreditBundle): string[];
}

export class PrimaryCreditBundleImpressionsRangeRule implements PrimaryCreditBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryCreditBundle): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryCreditBundleRequiredCodeRule implements PrimaryCreditBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryCreditBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryCreditBundleNameLengthRule implements PrimaryCreditBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryCreditBundle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryCreditBundleAttemptsRangeRule implements PrimaryCreditBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryCreditBundle): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryCreditBundleTitleLengthRule implements PrimaryCreditBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryCreditBundle): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryCreditBundleCohortLengthRule implements PrimaryCreditBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryCreditBundle): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary credit bundle. */
export class PrimaryCreditBundleValidator {
  rules: PrimaryCreditBundleRule[];

  constructor(rules: PrimaryCreditBundleRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryCreditBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryCreditBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryCreditBundle[]): Map<string, string[]> {
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

export function defaultPrimaryCreditBundleValidator(): PrimaryCreditBundleValidator {
  return new PrimaryCreditBundleValidator(
    [
      new PrimaryCreditBundleImpressionsRangeRule(32, 1000),
      new PrimaryCreditBundleRequiredCodeRule("primary credit bundle needs an entry"),
      new PrimaryCreditBundleNameLengthRule(64),
      new PrimaryCreditBundleAttemptsRangeRule(80, 86400),
      new PrimaryCreditBundleTitleLengthRule(1000),
      new PrimaryCreditBundleCohortLengthRule(1000),
    ],
  );
}
