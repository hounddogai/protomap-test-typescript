import { BatchedWaitBaseline } from "./batched-wait-baseline.js";

/** A rule a batched wait baseline must pass. Check returns its problems, or none. */
export interface BatchedWaitBaselineRule {
  check(item: BatchedWaitBaseline): string[];
}

export class BatchedWaitBaselineCodePrefixRule implements BatchedWaitBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedWaitBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedWaitBaselineRequiredSourceRule implements BatchedWaitBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedWaitBaseline): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedWaitBaselineRequiredTimezoneRule implements BatchedWaitBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedWaitBaseline): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedWaitBaselineTimezoneLengthRule implements BatchedWaitBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedWaitBaseline): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedWaitBaselineRequiredCodeRule implements BatchedWaitBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedWaitBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched wait baseline. */
export class BatchedWaitBaselineValidator {
  rules: BatchedWaitBaselineRule[];

  constructor(rules: BatchedWaitBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedWaitBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedWaitBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedWaitBaseline[]): Map<string, string[]> {
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

export function defaultBatchedWaitBaselineValidator(): BatchedWaitBaselineValidator {
  return new BatchedWaitBaselineValidator(
    [
      new BatchedWaitBaselineCodePrefixRule("REF"),
      new BatchedWaitBaselineRequiredSourceRule("batched wait baseline needs this field"),
      new BatchedWaitBaselineRequiredTimezoneRule("batched wait baseline needs this field"),
      new BatchedWaitBaselineTimezoneLengthRule(3600),
      new BatchedWaitBaselineRequiredCodeRule("batched wait baseline needs an entry"),
    ],
  );
}
