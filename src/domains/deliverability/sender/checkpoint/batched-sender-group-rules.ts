import { BatchedSenderGroup } from "./batched-sender-group.js";

/** A rule a batched sender group must pass. Check returns its problems, or none. */
export interface BatchedSenderGroupRule {
  check(item: BatchedSenderGroup): string[];
}

export class BatchedSenderGroupRequiredNameRule implements BatchedSenderGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedSenderGroup): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedSenderGroupCodeLengthRule implements BatchedSenderGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedSenderGroup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedSenderGroupNameLengthRule implements BatchedSenderGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedSenderGroup): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedSenderGroupImpressionsRangeRule implements BatchedSenderGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedSenderGroup): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedSenderGroupCodePrefixRule implements BatchedSenderGroupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedSenderGroup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a batched sender group. */
export class BatchedSenderGroupValidator {
  rules: BatchedSenderGroupRule[];

  constructor(rules: BatchedSenderGroupRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedSenderGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedSenderGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedSenderGroup[]): Map<string, string[]> {
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

export function defaultBatchedSenderGroupValidator(): BatchedSenderGroupValidator {
  return new BatchedSenderGroupValidator(
    [
      new BatchedSenderGroupRequiredNameRule("batched sender group needs an entry"),
      new BatchedSenderGroupCodeLengthRule(255),
      new BatchedSenderGroupNameLengthRule(32),
      new BatchedSenderGroupImpressionsRangeRule(255, 1000),
      new BatchedSenderGroupCodePrefixRule("OPS"),
    ],
  );
}
