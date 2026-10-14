import * as text from "../../../../kit/text.js";
import { BatchedFlightVariance } from "./batched-flight-variance.js";

/** A rule a batched flight variance must pass. Check returns its problems, or none. */
export interface BatchedFlightVarianceRule {
  check(item: BatchedFlightVariance): string[];
}

export class BatchedFlightVarianceRequiredCodeRule implements BatchedFlightVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedFlightVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedFlightVarianceVersionRangeRule implements BatchedFlightVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedFlightVariance): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedFlightVarianceAllowedNameRule implements BatchedFlightVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedFlightVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is too long`];
    return [];
  }
}

export class BatchedFlightVarianceCodePrefixRule implements BatchedFlightVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedFlightVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedFlightVarianceNameLengthRule implements BatchedFlightVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedFlightVariance): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched flight variance. */
export class BatchedFlightVarianceValidator {
  rules: BatchedFlightVarianceRule[];

  constructor(rules: BatchedFlightVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedFlightVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedFlightVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedFlightVariance[]): Map<string, string[]> {
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

export function defaultBatchedFlightVarianceValidator(): BatchedFlightVarianceValidator {
  return new BatchedFlightVarianceValidator(
    [
      new BatchedFlightVarianceRequiredCodeRule("batched flight variance needs a value"),
      new BatchedFlightVarianceVersionRangeRule(80, 86400),
      new BatchedFlightVarianceAllowedNameRule([]),
      new BatchedFlightVarianceCodePrefixRule("Q"),
      new BatchedFlightVarianceNameLengthRule(16),
    ],
  );
}
