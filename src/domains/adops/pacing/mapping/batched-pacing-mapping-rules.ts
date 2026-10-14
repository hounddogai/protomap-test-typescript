import { BatchedPacingMapping } from "./batched-pacing-mapping.js";

/** A rule a batched pacing mapping must pass. Check returns its problems, or none. */
export interface BatchedPacingMappingRule {
  check(item: BatchedPacingMapping): string[];
}

export class BatchedPacingMappingRetriesRangeRule implements BatchedPacingMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedPacingMapping): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedPacingMappingRequiredCodeRule implements BatchedPacingMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPacingMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedPacingMappingCodePrefixRule implements BatchedPacingMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedPacingMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedPacingMappingRequiredTitleRule implements BatchedPacingMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPacingMapping): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched pacing mapping. */
export class BatchedPacingMappingValidator {
  rules: BatchedPacingMappingRule[];

  constructor(rules: BatchedPacingMappingRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedPacingMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedPacingMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedPacingMapping[]): Map<string, string[]> {
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

export function defaultBatchedPacingMappingValidator(): BatchedPacingMappingValidator {
  return new BatchedPacingMappingValidator(
    [
      new BatchedPacingMappingRetriesRangeRule(32, 3600),
      new BatchedPacingMappingRequiredCodeRule("batched pacing mapping needs a value"),
      new BatchedPacingMappingCodePrefixRule("REF"),
      new BatchedPacingMappingRequiredTitleRule("batched pacing mapping needs an entry"),
    ],
  );
}
