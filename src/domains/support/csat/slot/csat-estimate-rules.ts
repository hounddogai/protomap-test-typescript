import * as text from "../../../../kit/text.js";
import { CsatEstimate } from "./csat-estimate.js";

/** A rule a csat estimate must pass. Check returns its problems, or none. */
export interface CsatEstimateRule {
  check(item: CsatEstimate): string[];
}

export class CsatEstimateAllowedCodeRule implements CsatEstimateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CsatEstimate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class CsatEstimateCapacityRangeRule implements CsatEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CsatEstimate): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CsatEstimateTagsLimitRule implements CsatEstimateRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: CsatEstimate): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class CsatEstimateRequiredCodeRule implements CsatEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatEstimate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CsatEstimateLabelLengthRule implements CsatEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatEstimate): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CsatEstimateBidRangeRule implements CsatEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CsatEstimate): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a csat estimate. */
export class CsatEstimateValidator {
  rules: CsatEstimateRule[];

  constructor(rules: CsatEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: CsatEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CsatEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CsatEstimate[]): Map<string, string[]> {
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

export function defaultCsatEstimateValidator(): CsatEstimateValidator {
  return new CsatEstimateValidator(
    [
      new CsatEstimateAllowedCodeRule(["legacy", "scheduled"]),
      new CsatEstimateCapacityRangeRule(64, 1000),
      new CsatEstimateTagsLimitRule(3600, ["pending"]),
      new CsatEstimateRequiredCodeRule("csat estimate needs this field"),
      new CsatEstimateLabelLengthRule(80),
      new CsatEstimateBidRangeRule(1.1, 3790.4),
    ],
  );
}
