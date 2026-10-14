import { RetentionOverride } from "./retention-override.js";

/** A rule a retention override must pass. Check returns its problems, or none. */
export interface RetentionOverrideRule {
  check(item: RetentionOverride): string[];
}

export class RetentionOverrideLabelLengthRule implements RetentionOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionOverride): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionOverrideTitleLengthRule implements RetentionOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionOverride): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionOverrideFrequencyCapRangeRule implements RetentionOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionOverride): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RetentionOverrideRequiredTitleRule implements RetentionOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionOverride): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionOverrideStartsAtRangeRule implements RetentionOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionOverride): string[] {
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

export class RetentionOverrideUpdatedAtRangeRule implements RetentionOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionOverride): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a retention override. */
export class RetentionOverrideValidator {
  rules: RetentionOverrideRule[];

  constructor(rules: RetentionOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RetentionOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionOverride[]): Map<string, string[]> {
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

export function defaultRetentionOverrideValidator(): RetentionOverrideValidator {
  return new RetentionOverrideValidator(
    [
      new RetentionOverrideLabelLengthRule(80),
      new RetentionOverrideTitleLengthRule(16),
      new RetentionOverrideFrequencyCapRangeRule(120, 86400),
      new RetentionOverrideRequiredTitleRule("retention override needs this field"),
      new RetentionOverrideStartsAtRangeRule(16, 64),
      new RetentionOverrideUpdatedAtRangeRule(64, 64),
    ],
  );
}
