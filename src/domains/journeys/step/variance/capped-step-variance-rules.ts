import * as text from "../../../../kit/text.js";
import { CappedStepVariance } from "./capped-step-variance.js";

/** A rule a capped step variance must pass. Check returns its problems, or none. */
export interface CappedStepVarianceRule {
  check(item: CappedStepVariance): string[];
}

export class CappedStepVarianceAllowedCodeRule implements CappedStepVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedStepVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

export class CappedStepVarianceTitleLengthRule implements CappedStepVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedStepVariance): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedStepVarianceRetriesRangeRule implements CappedStepVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedStepVariance): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedStepVarianceStartsAtRangeRule implements CappedStepVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedStepVariance): string[] {
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

export class CappedStepVarianceDescriptionLengthRule implements CappedStepVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedStepVariance): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped step variance. */
export class CappedStepVarianceValidator {
  rules: CappedStepVarianceRule[];

  constructor(rules: CappedStepVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: CappedStepVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      const found = rule.check(item);
      if (found.length === 0) continue;
      for (const problem of found) {
        problems.push(`${item.code}: ${problem}`);
      }
    }
    return problems;
  }

  requireValid(item: CappedStepVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedStepVariance[]): Map<string, string[]> {
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

export function defaultCappedStepVarianceValidator(): CappedStepVarianceValidator {
  return new CappedStepVarianceValidator(
    [
      new CappedStepVarianceAllowedCodeRule(["tiered", "weighted", "primary"]),
      new CappedStepVarianceTitleLengthRule(16),
      new CappedStepVarianceRetriesRangeRule(64, 86400),
      new CappedStepVarianceStartsAtRangeRule(80, 1000),
      new CappedStepVarianceDescriptionLengthRule(32),
    ],
  );
}
