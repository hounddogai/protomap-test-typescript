import { BatchedCohortOverride } from "./batched-cohort-override.js";

/** A rule a batched cohort override must pass. Check returns its problems, or none. */
export interface BatchedCohortOverrideRule {
  check(item: BatchedCohortOverride): string[];
}

export class BatchedCohortOverrideSegmentLengthRule implements BatchedCohortOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedCohortOverride): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedCohortOverrideCodePrefixRule implements BatchedCohortOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedCohortOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedCohortOverrideRequiredUtmSourceRule implements BatchedCohortOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedCohortOverride): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedCohortOverrideRequiredCodeRule implements BatchedCohortOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedCohortOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedCohortOverrideQuantityRangeRule implements BatchedCohortOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedCohortOverride): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a batched cohort override. */
export class BatchedCohortOverrideValidator {
  rules: BatchedCohortOverrideRule[];

  constructor(rules: BatchedCohortOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedCohortOverride): string[] {
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

  requireValid(item: BatchedCohortOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedCohortOverride[]): Map<string, string[]> {
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

export function defaultBatchedCohortOverrideValidator(): BatchedCohortOverrideValidator {
  return new BatchedCohortOverrideValidator(
    [
      new BatchedCohortOverrideSegmentLengthRule(255),
      new BatchedCohortOverrideCodePrefixRule("X"),
      new BatchedCohortOverrideRequiredUtmSourceRule("batched cohort override needs a value"),
      new BatchedCohortOverrideRequiredCodeRule("batched cohort override needs an entry"),
      new BatchedCohortOverrideQuantityRangeRule(32, 1000),
    ],
  );
}
