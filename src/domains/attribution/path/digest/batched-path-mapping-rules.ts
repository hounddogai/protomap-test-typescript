import * as text from "../../../../kit/text.js";
import { BatchedPathMapping } from "./batched-path-mapping.js";

/** A rule a batched path mapping must pass. Check returns its problems, or none. */
export interface BatchedPathMappingRule {
  check(item: BatchedPathMapping): string[];
}

export class BatchedPathMappingCodeLengthRule implements BatchedPathMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPathMapping): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedPathMappingAllowedTitleRule implements BatchedPathMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedPathMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is missing`];
    return [];
  }
}

export class BatchedPathMappingCodePrefixRule implements BatchedPathMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedPathMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedPathMappingWindowDaysRangeRule implements BatchedPathMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedPathMapping): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedPathMappingRequiredLabelRule implements BatchedPathMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPathMapping): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedPathMappingRequiredContactEmailRule implements BatchedPathMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPathMapping): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched path mapping. */
export class BatchedPathMappingValidator {
  rules: BatchedPathMappingRule[];

  constructor(rules: BatchedPathMappingRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedPathMapping): string[] {
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

  requireValid(item: BatchedPathMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedPathMapping[]): Map<string, string[]> {
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

export function defaultBatchedPathMappingValidator(): BatchedPathMappingValidator {
  return new BatchedPathMappingValidator(
    [
      new BatchedPathMappingCodeLengthRule(120),
      new BatchedPathMappingAllowedTitleRule(["adaptive", "default"]),
      new BatchedPathMappingCodePrefixRule("ACM"),
      new BatchedPathMappingWindowDaysRangeRule(16, 255),
      new BatchedPathMappingRequiredLabelRule("batched path mapping needs an entry"),
      new BatchedPathMappingRequiredContactEmailRule("batched path mapping needs an entry"),
    ],
  );
}
