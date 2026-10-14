import { BatchedSlaAgreement } from "./batched-sla-agreement.js";

/** A rule a batched sla agreement must pass. Check returns its problems, or none. */
export interface BatchedSlaAgreementRule {
  check(item: BatchedSlaAgreement): string[];
}

export class BatchedSlaAgreementCreatedAtRangeRule implements BatchedSlaAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedSlaAgreement): string[] {
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

export class BatchedSlaAgreementImpressionsRangeRule implements BatchedSlaAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedSlaAgreement): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedSlaAgreementRequiredCodeRule implements BatchedSlaAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedSlaAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedSlaAgreementCodeLengthRule implements BatchedSlaAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedSlaAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedSlaAgreementCurrencyLengthRule implements BatchedSlaAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedSlaAgreement): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched sla agreement. */
export class BatchedSlaAgreementValidator {
  rules: BatchedSlaAgreementRule[];

  constructor(rules: BatchedSlaAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedSlaAgreement): string[] {
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

  requireValid(item: BatchedSlaAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedSlaAgreement[]): Map<string, string[]> {
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

export function defaultBatchedSlaAgreementValidator(): BatchedSlaAgreementValidator {
  return new BatchedSlaAgreementValidator(
    [
      new BatchedSlaAgreementCreatedAtRangeRule(1000, 86400),
      new BatchedSlaAgreementImpressionsRangeRule(120, 3600),
      new BatchedSlaAgreementRequiredCodeRule("batched sla agreement needs a value"),
      new BatchedSlaAgreementCodeLengthRule(120),
      new BatchedSlaAgreementCurrencyLengthRule(255),
    ],
  );
}
