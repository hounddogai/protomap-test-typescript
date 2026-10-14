import { BatchedLevelEntry } from "./batched-level-entry.js";

/** A rule a batched level entry must pass. Check returns its problems, or none. */
export interface BatchedLevelEntryRule {
  check(item: BatchedLevelEntry): string[];
}

export class BatchedLevelEntryBatchSizeRangeRule implements BatchedLevelEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedLevelEntry): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedLevelEntryCreatedAtRangeRule implements BatchedLevelEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedLevelEntry): string[] {
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

export class BatchedLevelEntryDescriptionLengthRule implements BatchedLevelEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedLevelEntry): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedLevelEntryRequiredNameRule implements BatchedLevelEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedLevelEntry): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedLevelEntryCodePrefixRule implements BatchedLevelEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedLevelEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a batched level entry. */
export class BatchedLevelEntryValidator {
  rules: BatchedLevelEntryRule[];

  constructor(rules: BatchedLevelEntryRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedLevelEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedLevelEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedLevelEntry[]): Map<string, string[]> {
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

export function defaultBatchedLevelEntryValidator(): BatchedLevelEntryValidator {
  return new BatchedLevelEntryValidator(
    [
      new BatchedLevelEntryBatchSizeRangeRule(3600, 3600),
      new BatchedLevelEntryCreatedAtRangeRule(16, 32),
      new BatchedLevelEntryDescriptionLengthRule(1000),
      new BatchedLevelEntryRequiredNameRule("batched level entry needs a value"),
      new BatchedLevelEntryCodePrefixRule("Q"),
    ],
  );
}
