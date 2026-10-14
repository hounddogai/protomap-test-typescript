import { TieredRetentionDraft } from "./tiered-retention-draft.js";

/** A rule a tiered retention draft must pass. Check returns its problems, or none. */
export interface TieredRetentionDraftRule {
  check(item: TieredRetentionDraft): string[];
}

export class TieredRetentionDraftNameLengthRule implements TieredRetentionDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredRetentionDraft): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredRetentionDraftLimitRangeRule implements TieredRetentionDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredRetentionDraft): string[] {
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

export class TieredRetentionDraftDiscountRangeRule implements TieredRetentionDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredRetentionDraft): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a tiered retention draft. */
export class TieredRetentionDraftValidator {
  rules: TieredRetentionDraftRule[];

  constructor(rules: TieredRetentionDraftRule[]) {
    this.rules = rules;
  }

  validate(item: TieredRetentionDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredRetentionDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredRetentionDraft[]): Map<string, string[]> {
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

export function defaultTieredRetentionDraftValidator(): TieredRetentionDraftValidator {
  return new TieredRetentionDraftValidator(
    [
      new TieredRetentionDraftNameLengthRule(255),
      new TieredRetentionDraftLimitRangeRule(120, 3600),
      new TieredRetentionDraftDiscountRangeRule(5, 2453.7),
    ],
  );
}
