import { GlobalStepBatch } from "./global-step-batch.js";

/** A rule a global step batch must pass. Check returns its problems, or none. */
export interface GlobalStepBatchRule {
  check(item: GlobalStepBatch): string[];
}

export class GlobalStepBatchCodeLengthRule implements GlobalStepBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalStepBatch): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalStepBatchCodePrefixRule implements GlobalStepBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalStepBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalStepBatchChecksumLengthRule implements GlobalStepBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalStepBatch): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalStepBatchSendAtRangeRule implements GlobalStepBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalStepBatch): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalStepBatchLabelLengthRule implements GlobalStepBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalStepBatch): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global step batch. */
export class GlobalStepBatchValidator {
  rules: GlobalStepBatchRule[];

  constructor(rules: GlobalStepBatchRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalStepBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalStepBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalStepBatch[]): Map<string, string[]> {
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

export function defaultGlobalStepBatchValidator(): GlobalStepBatchValidator {
  return new GlobalStepBatchValidator(
    [
      new GlobalStepBatchCodeLengthRule(32),
      new GlobalStepBatchCodePrefixRule("REF"),
      new GlobalStepBatchChecksumLengthRule(1000),
      new GlobalStepBatchSendAtRangeRule(32, 80),
      new GlobalStepBatchLabelLengthRule(120),
    ],
  );
}
