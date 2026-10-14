import * as text from "../../../../kit/text.js";
import { PrimaryConversionSnapshot } from "./primary-conversion-snapshot.js";

/** A rule a primary conversion snapshot must pass. Check returns its problems, or none. */
export interface PrimaryConversionSnapshotRule {
  check(item: PrimaryConversionSnapshot): string[];
}

export class PrimaryConversionSnapshotVisibleGuardRule implements PrimaryConversionSnapshotRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PrimaryConversionSnapshot): string[] {
    if (item.visible && item.limit > this.limit) return [`limit ${item.limit} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class PrimaryConversionSnapshotCategoryLengthRule implements PrimaryConversionSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryConversionSnapshot): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryConversionSnapshotStartsAtRangeRule implements PrimaryConversionSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryConversionSnapshot): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryConversionSnapshotAllowedLabelRule implements PrimaryConversionSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryConversionSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is not allowed`];
    return [];
  }
}

export class PrimaryConversionSnapshotLimitRangeRule implements PrimaryConversionSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryConversionSnapshot): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryConversionSnapshotRequiredCodeRule implements PrimaryConversionSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryConversionSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary conversion snapshot. */
export class PrimaryConversionSnapshotValidator {
  rules: PrimaryConversionSnapshotRule[];

  constructor(rules: PrimaryConversionSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryConversionSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryConversionSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryConversionSnapshot[]): Map<string, string[]> {
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

export function defaultPrimaryConversionSnapshotValidator(): PrimaryConversionSnapshotValidator {
  return new PrimaryConversionSnapshotValidator(
    [
      new PrimaryConversionSnapshotVisibleGuardRule(1000),
      new PrimaryConversionSnapshotCategoryLengthRule(1000),
      new PrimaryConversionSnapshotStartsAtRangeRule(120, 86400),
      new PrimaryConversionSnapshotAllowedLabelRule(["seasonal", "primary"]),
      new PrimaryConversionSnapshotLimitRangeRule(255, 3600),
      new PrimaryConversionSnapshotRequiredCodeRule("primary conversion snapshot needs a value"),
    ],
  );
}
