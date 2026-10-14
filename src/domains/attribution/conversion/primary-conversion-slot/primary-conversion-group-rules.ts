import { PrimaryConversionGroup } from "./primary-conversion-group.js";

/** A rule a primary conversion group must pass. Check returns its problems, or none. */
export interface PrimaryConversionGroupRule {
  check(item: PrimaryConversionGroup): string[];
}

export class PrimaryConversionGroupUtmSourceLengthRule implements PrimaryConversionGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryConversionGroup): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryConversionGroupTitleLengthRule implements PrimaryConversionGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryConversionGroup): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryConversionGroupRequiredUtmSourceRule implements PrimaryConversionGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryConversionGroup): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryConversionGroupRequiredCodeRule implements PrimaryConversionGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryConversionGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryConversionGroupLimitRangeRule implements PrimaryConversionGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryConversionGroup): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryConversionGroupVisibleGuardRule implements PrimaryConversionGroupRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PrimaryConversionGroup): string[] {
    if (item.visible && item.limit > this.limit) return [`limit ${item.limit} exceeds ${this.limit} while visible`];
    return [];
  }
}

/** Runs every rule of a primary conversion group. */
export class PrimaryConversionGroupValidator {
  rules: PrimaryConversionGroupRule[];

  constructor(rules: PrimaryConversionGroupRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryConversionGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryConversionGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryConversionGroup[]): Map<string, string[]> {
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

export function defaultPrimaryConversionGroupValidator(): PrimaryConversionGroupValidator {
  return new PrimaryConversionGroupValidator(
    [
      new PrimaryConversionGroupUtmSourceLengthRule(16),
      new PrimaryConversionGroupTitleLengthRule(64),
      new PrimaryConversionGroupRequiredUtmSourceRule("primary conversion group needs this field"),
      new PrimaryConversionGroupRequiredCodeRule("primary conversion group needs this field"),
      new PrimaryConversionGroupLimitRangeRule(16, 64),
      new PrimaryConversionGroupVisibleGuardRule(80),
    ],
  );
}
