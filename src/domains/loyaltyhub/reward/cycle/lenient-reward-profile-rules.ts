import * as text from "../../../../kit/text.js";
import { LenientRewardProfile } from "./lenient-reward-profile.js";

/** A rule a lenient reward profile must pass. Check returns its problems, or none. */
export interface LenientRewardProfileRule {
  check(item: LenientRewardProfile): string[];
}

export class LenientRewardProfileCodeLengthRule implements LenientRewardProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientRewardProfile): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientRewardProfileApprovedGuardRule implements LenientRewardProfileRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LenientRewardProfile): string[] {
    if (item.approved && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class LenientRewardProfileCreatedAtRangeRule implements LenientRewardProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientRewardProfile): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientRewardProfileLabelLengthRule implements LenientRewardProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientRewardProfile): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientRewardProfileAllowedSourceRule implements LenientRewardProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientRewardProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.source))) return [`source ${item.source} is below minimum`];
    return [];
  }
}

export class LenientRewardProfileScoreRangeRule implements LenientRewardProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientRewardProfile): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a lenient reward profile. */
export class LenientRewardProfileValidator {
  rules: LenientRewardProfileRule[];

  constructor(rules: LenientRewardProfileRule[]) {
    this.rules = rules;
  }

  validate(item: LenientRewardProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientRewardProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientRewardProfile[]): Map<string, string[]> {
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

export function defaultLenientRewardProfileValidator(): LenientRewardProfileValidator {
  return new LenientRewardProfileValidator(
    [
      new LenientRewardProfileCodeLengthRule(32),
      new LenientRewardProfileApprovedGuardRule(0.2),
      new LenientRewardProfileCreatedAtRangeRule(255, 86400),
      new LenientRewardProfileLabelLengthRule(255),
      new LenientRewardProfileAllowedSourceRule(["weighted"]),
      new LenientRewardProfileScoreRangeRule(2.3, 1471.8),
    ],
  );
}
