import { BatchedSuppressionAgreement } from "./batched-suppression-agreement.js";

/** A rule a batched suppression agreement must pass. Check returns its problems, or none. */
export interface BatchedSuppressionAgreementRule {
  check(item: BatchedSuppressionAgreement): string[];
}

export class BatchedSuppressionAgreementRequiredCodeRule implements BatchedSuppressionAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedSuppressionAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedSuppressionAgreementBatchSizeRangeRule implements BatchedSuppressionAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedSuppressionAgreement): string[] {
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

export class BatchedSuppressionAgreementCodePrefixRule implements BatchedSuppressionAgreementRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedSuppressionAgreement): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedSuppressionAgreementRequiredNameRule implements BatchedSuppressionAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedSuppressionAgreement): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedSuppressionAgreementNameLengthRule implements BatchedSuppressionAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedSuppressionAgreement): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched suppression agreement. */
export class BatchedSuppressionAgreementValidator {
  rules: BatchedSuppressionAgreementRule[];

  constructor(rules: BatchedSuppressionAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedSuppressionAgreement): string[] {
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

  requireValid(item: BatchedSuppressionAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedSuppressionAgreement[]): Map<string, string[]> {
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

export function defaultBatchedSuppressionAgreementValidator(): BatchedSuppressionAgreementValidator {
  return new BatchedSuppressionAgreementValidator(
    [
      new BatchedSuppressionAgreementRequiredCodeRule("batched suppression agreement needs an entry"),
      new BatchedSuppressionAgreementBatchSizeRangeRule(120, 1000),
      new BatchedSuppressionAgreementCodePrefixRule("REF"),
      new BatchedSuppressionAgreementRequiredNameRule("batched suppression agreement needs an entry"),
      new BatchedSuppressionAgreementNameLengthRule(86400),
    ],
  );
}
