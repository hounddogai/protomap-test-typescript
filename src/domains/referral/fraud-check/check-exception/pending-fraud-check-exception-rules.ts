import { PendingFraudCheckException } from "./pending-fraud-check-exception.js";

/** A rule a pending fraud check exception must pass. Check returns its problems, or none. */
export interface PendingFraudCheckExceptionRule {
  check(item: PendingFraudCheckException): string[];
}

export class PendingFraudCheckExceptionRequiredLabelRule implements PendingFraudCheckExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingFraudCheckException): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PendingFraudCheckExceptionBudgetRangeRule implements PendingFraudCheckExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingFraudCheckException): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingFraudCheckExceptionRequiredAudienceIdRule implements PendingFraudCheckExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingFraudCheckException): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class PendingFraudCheckExceptionBidRangeRule implements PendingFraudCheckExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingFraudCheckException): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingFraudCheckExceptionCodeLengthRule implements PendingFraudCheckExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingFraudCheckException): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending fraud check exception. */
export class PendingFraudCheckExceptionValidator {
  rules: PendingFraudCheckExceptionRule[];

  constructor(rules: PendingFraudCheckExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: PendingFraudCheckException): string[] {
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

  requireValid(item: PendingFraudCheckException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingFraudCheckException[]): Map<string, string[]> {
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

export function defaultPendingFraudCheckExceptionValidator(): PendingFraudCheckExceptionValidator {
  return new PendingFraudCheckExceptionValidator(
    [
      new PendingFraudCheckExceptionRequiredLabelRule("pending fraud check exception needs this field"),
      new PendingFraudCheckExceptionBudgetRangeRule(2, 2542.9),
      new PendingFraudCheckExceptionRequiredAudienceIdRule("pending fraud check exception needs this field"),
      new PendingFraudCheckExceptionBidRangeRule(6.1, 106.9),
      new PendingFraudCheckExceptionCodeLengthRule(86400),
    ],
  );
}
