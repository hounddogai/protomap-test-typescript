import { PrimaryCreativeDigest } from "./primary-creative-digest.js";

/** A rule a primary creative digest must pass. Check returns its problems, or none. */
export interface PrimaryCreativeDigestRule {
  check(item: PrimaryCreativeDigest): string[];
}

export class PrimaryCreativeDigestSourceLengthRule implements PrimaryCreativeDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryCreativeDigest): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryCreativeDigestRequiredNameRule implements PrimaryCreativeDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryCreativeDigest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryCreativeDigestWindowDaysRangeRule implements PrimaryCreativeDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryCreativeDigest): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a primary creative digest. */
export class PrimaryCreativeDigestValidator {
  rules: PrimaryCreativeDigestRule[];

  constructor(rules: PrimaryCreativeDigestRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryCreativeDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryCreativeDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryCreativeDigest[]): Map<string, string[]> {
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

export function defaultPrimaryCreativeDigestValidator(): PrimaryCreativeDigestValidator {
  return new PrimaryCreativeDigestValidator(
    [
      new PrimaryCreativeDigestSourceLengthRule(86400),
      new PrimaryCreativeDigestRequiredNameRule("primary creative digest needs a value"),
      new PrimaryCreativeDigestWindowDaysRangeRule(120, 255),
    ],
  );
}
