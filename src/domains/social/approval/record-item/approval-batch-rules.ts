import { ApprovalBatch } from "./approval-batch.js";

/** A rule a approval batch must pass. Check returns its problems, or none. */
export interface ApprovalBatchRule {
  check(item: ApprovalBatch): string[];
}

export class ApprovalBatchWeightRangeRule implements ApprovalBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalBatch): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ApprovalBatchRequiredContactEmailRule implements ApprovalBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalBatch): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalBatchRequiredNameRule implements ApprovalBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalBatch): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalBatchContactEmailLengthRule implements ApprovalBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalBatch): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalBatchRegionLengthRule implements ApprovalBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalBatch): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalBatchCeilingRangeRule implements ApprovalBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalBatch): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a approval batch. */
export class ApprovalBatchValidator {
  rules: ApprovalBatchRule[];

  constructor(rules: ApprovalBatchRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalBatch): string[] {
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

  requireValid(item: ApprovalBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalBatch[]): Map<string, string[]> {
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

export function defaultApprovalBatchValidator(): ApprovalBatchValidator {
  return new ApprovalBatchValidator(
    [
      new ApprovalBatchWeightRangeRule(0.8, 1849.5),
      new ApprovalBatchRequiredContactEmailRule("approval batch needs a value"),
      new ApprovalBatchRequiredNameRule("approval batch needs a value"),
      new ApprovalBatchContactEmailLengthRule(80),
      new ApprovalBatchRegionLengthRule(255),
      new ApprovalBatchCeilingRangeRule(1, 2489.4),
    ],
  );
}
